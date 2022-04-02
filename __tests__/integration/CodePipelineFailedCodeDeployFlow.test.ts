import "dotenv/config";
import {
  DynamoDBClient,
  DeleteItemCommand,
  DeleteItemCommandInput,
} from "@aws-sdk/client-dynamodb";

import {
  CodeBuildClient,
  BatchGetBuildsCommand,
} from "@aws-sdk/client-codebuild";

import {
  CodeDeployClient,
  BatchGetDeploymentTargetsCommand,
  ListDeploymentTargetsCommand,
} from "@aws-sdk/client-codedeploy";

import { mockClient } from "aws-sdk-client-mock";
import { BitBucket } from "../../src/lib/BitBucket";
import {
  Commit,
  RawMessage,
  Notification,
  PipelineNotification,
} from "../../src/types/common";
import {
  CodePipelineExecutionEvent,
  CodePipelineStageEvent,
  CodePipelineActionEvent,
} from "../../src/types/AwsCodePipeline";
import { Meerkat } from "../../src/Meerkat";
import { AWS_LIST_TARGETS, AWS_BATCH_TARGETS } from "../sample/aws/codeDeploy";
import { SAMPLE_BATCH_BUILDS } from "../sample/aws/codeBuild";

/* #################################################### */
/*
Set to true to run these integration test. Typically only want to do this during development.

Integration tests require that the local dynamo db docker container is up and running.

Use the _dev/start.sh script to launchh the local instance.

Also make sure the .env file has entry of:

DB_TABLE=meerkat
DYNAMO_ENDPOINT=http://localhost:8000
*/
/* #################################################### */
const RUN_INTEGRATION_TESTS = false;

const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;
const DYNAMO_DB = new DynamoDBClient({
  endpoint: DYNAMO_ENDPOINT,
  region: "ap-southeast-2",
});
const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";
const codeBuildMock = mockClient(CodeBuildClient) as any;
const codeDeployMock = mockClient(CodeDeployClient) as any;

jest.mock("../../src/lib/BitBucket", () => {
  return {
    BitBucket: jest.fn().mockImplementation(() => {
      return {
        fetchCommit: (repo: string, commitId: string): Promise<Commit> => {
          return new Promise((resolve, reject) => {
            resolve({
              id: "f7ec85262da48e2b15d03037b138963c5a89d39f",
              author: "Marcel Scherzet <mscherzer@gmail.com>",
              summary:
                "DEV-666 - Custom verification link for NLE\n\nRequires a matching lambda function\n",
              link: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/commit/3fcdaa5ac3e29c79008319ede6c092643f204af0",
            });
          });
        },
      };
    }),
  };
});

const bitBucket = new BitBucket("", "");

beforeEach(async () => {
  codeBuildMock.reset();
  codeDeployMock.reset();
  const deleteItemCommandInput: DeleteItemCommandInput = {
    TableName: DB_TABLE,
    Key: {
      executionId: { S: "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969" },
    },
  };
  const deleteItemCommand = new DeleteItemCommand(deleteItemCommandInput);
  await DYNAMO_DB.send(deleteItemCommand);
});

test("integration_pipeline-fail-code-deploy", async () => {
  if (!RUN_INTEGRATION_TESTS) {
    console.info(
      "\x1b[33m%s\x1b[0m",
      "INTEGRATION_TESTS are disabled. Skipping all integration tests."
    );
    return;
  }
  codeBuildMock.on(BatchGetBuildsCommand).resolves(SAMPLE_BATCH_BUILDS);
  codeDeployMock.on(ListDeploymentTargetsCommand).resolves(AWS_LIST_TARGETS);
  codeDeployMock
    .on(BatchGetDeploymentTargetsCommand)
    .resolves(AWS_BATCH_TARGETS);

  const meerkat = new Meerkat(DYNAMO_DB, bitBucket, "discord");

  const events = getCodePipelineFailedCodeDeployFlow();
  let previousNotification: Notification | null = null;
  for await (const event of events) {
    const rawMessage: RawMessage = {
      isJson: true,
      subject: "",
      body: event,
    };

    const notification = await meerkat.handleMessage(rawMessage);
    if (notification) {
      expect(previousNotification).toBeNull();
      previousNotification = notification;
    }
  }

  if (previousNotification) {
    expect(previousNotification.type).toBe("PipelineNotification");
    const pipelineNotification = previousNotification as PipelineNotification;
    expect(pipelineNotification.successfull).toBe(false);
    expect(pipelineNotification.failureDetail?.type).toBe("CodeDeploy");
  } else {
    expect(previousNotification).not.toBeNull();
  }
});

/**
 * An array of events captured from a failed code pipleine execution due to a broken code deployment.
 * 1) Checkout Out
 * 2) Build with Code Build.
 * 3) Failed  Code Deploment to multiple target groups.
 * @returns
 */

const getCodePipelineFailedCodeDeployFlow = () => {
  const event: (
    | CodePipelineExecutionEvent
    | CodePipelineActionEvent
    | CodePipelineStageEvent
  )[] = [];

  /* ===========================================================*/
  /* 2022-04-02T08:08:35.983Z */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Stage Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:08:28Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      state: "STARTED",
      stage: "Source",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      sourceActions: [],
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:08:52.478 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:08:47Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "Build",
      action: "Build",
      "input-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat/SourceArti/rC0O0p5",
          },
        },
      ],
      state: "STARTED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeBuild",
        category: "Build",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:08:53.619 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Stage Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:08:46Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      state: "STARTED",
      stage: "Build",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      sourceActions: [],
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:08:36.828 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Pipeline Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:08:28Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      "execution-trigger": {
        "trigger-type": "Webhook",
        "trigger-detail":
          "arn:aws:codestar-connections:ap-southeast-2:000000000000:connection/0defde9e-8b96-474b-b276-459c07f5fafd",
      },
      state: "STARTED",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:08:40.900 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:08:28Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "Source",
      action: "Source",
      state: "STARTED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeStarSourceConnection",
        category: "Source",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:08:51.331 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Stage Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:08:46Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      state: "SUCCEEDED",
      stage: "Source",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      sourceActions: [],
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:08:51.966 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:08:46Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "Source",
      "execution-result": {
        "external-execution-url":
          "https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:000000000000:connection/0defde9e-8b96-474b-b276-459c07f5fafd&referenceType=COMMIT&FullRepositoryId=project/meerkat&Commit=8e0c6fb80e09020556d271d4cf0bacdab3614fbd",
        "external-execution-summary":
          '{"ProviderType":"Bitbucket","CommitMessage":"Try to break a deployment.\\n"}',
        "external-execution-id": "8e0c6fb80e09020556d271d4cf0bacdab3614fbd",
      },
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat/SourceArti/rC0O0p5",
          },
        },
      ],
      action: "Source",
      state: "SUCCEEDED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeStarSourceConnection",
        category: "Source",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:17:35.792 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Stage Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:17:30Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      state: "STARTED",
      stage: "DeployToExternalAccount",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      sourceActions: [],
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:17:39.531 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Stage Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:17:30Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      state: "SUCCEEDED",
      stage: "Build",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      sourceActions: [],
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:17:39.871 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:17:31Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      action: "Deploy-GREEN",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat/BuildArtif/7KbyKbn",
          },
        },
      ],
      state: "STARTED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:17:40.266 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:17:30Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      action: "Deploy-ORANGE",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat/BuildArtif/7KbyKbn",
          },
        },
      ],
      state: "STARTED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:17:40.439 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:17:31Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      action: "Deploy-RED",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat/BuildArtif/7KbyKbn",
          },
        },
      ],
      state: "STARTED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:17:40.626 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:17:30Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "Build",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:91c87dfe-a901-456f-8b7c-9d1dc497714b/view/new",
        "external-execution-id": "meerkat:db8d0212-7f9a-41cd-a33e-f87c0db3f911",
      },
      "output-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat/BuildArtif/7KbyKbn",
          },
        },
      ],
      action: "Build",
      state: "SUCCEEDED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeBuild",
        category: "Build",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:23:19.088 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:23:12Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-KH37TM9SF",
        "external-execution-summary": "Deployment d-KH37TM9SF failed",
        "external-execution-id": "d-KH37TM9SF",
        "error-code": "JobFailed",
      },
      action: "Deploy-GREEN",
      state: "FAILED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      additionalInformation: "Deployment d-KH37TM9SF failed",
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:23:21.889 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:23:13Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-SUP6PC9SF",
        "external-execution-summary": "Deployment d-SUP6PC9SF failed",
        "external-execution-id": "d-SUP6PC9SF",
        "error-code": "JobFailed",
      },
      action: "Deploy-BLUE",
      state: "FAILED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      additionalInformation: "Deployment d-SUP6PC9SF failed",
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:23:24.263 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:23:12Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-QJ1WPX8SF",
        "external-execution-summary": "Deployment d-QJ1WPX8SF failed",
        "external-execution-id": "d-QJ1WPX8SF",
        "error-code": "JobFailed",
      },
      action: "Deploy-ORANGE",
      state: "FAILED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      additionalInformation: "Deployment d-QJ1WPX8SF failed",
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:23:25.885 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:23:12Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-XGTBRT9SF",
        "external-execution-summary": "Deployment d-XGTBRT9SF failed",
        "external-execution-id": "d-XGTBRT9SF",
        "error-code": "JobFailed",
      },
      action: "Deploy-RED",
      state: "FAILED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      additionalInformation: "Deployment d-XGTBRT9SF failed",
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:17:31 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:17:31Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      stage: "DeployToExternalAccount",
      action: "Deploy-BLUE",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat/BuildArtif/7KbyKbn",
          },
        },
      ],
      state: "STARTED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T08:23:18.615 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Stage Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:23:13Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      state: "FAILED",
      stage: "DeployToExternalAccount",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      failedActionCount: 4,
      failedActions: [
        {
          action: "Deploy-RED",
          additionalInformation: "Deployment d-XGTBRT9SF failed",
        },
        {
          action: "Deploy-GREEN",
          additionalInformation: "Deployment d-KH37TM9SF failed",
        },
        {
          action: "Deploy-BLUE",
          additionalInformation: "Deployment d-SUP6PC9SF failed",
        },
        {
          action: "Deploy-ORANGE",
          additionalInformation: "Deployment d-QJ1WPX8SF failed",
        },
      ],
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T08:23:24.509 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Pipeline Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T08:23:13Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat",
      "execution-id": "8bdcdf4b-2dd1-4bbe-8aeb-562ff8b55969",
      state: "FAILED",
      version: 16,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      failedActionCount: 4,
      failedActions: [
        {
          action: "Deploy-RED",
          additionalInformation: "Deployment d-XGTBRT9SF failed",
        },
        {
          action: "Deploy-GREEN",
          additionalInformation: "Deployment d-KH37TM9SF failed",
        },
        {
          action: "Deploy-BLUE",
          additionalInformation: "Deployment d-SUP6PC9SF failed",
        },
        {
          action: "Deploy-ORANGE",
          additionalInformation: "Deployment d-QJ1WPX8SF failed",
        },
      ],
      failedStage: "DeployToExternalAccount",
    },
  });

  return event;
};
