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

test("integration_pipeline-fail-code-build", async () => {
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

  const events = getCodePipelineFailedCodeBuildFlow();
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
    expect(pipelineNotification.failureDetail?.type).toBe("CodeBuild");
  } else {
    expect(previousNotification).not.toBeNull();
  }
});

/**
 * An array of events captured from a failed code pipleine execution due to a broken code build.
 * NOTE: This example only captured Action and Pipele failure and succeeded events.
 * 1) Checkout Out
 * 2) Build with Code Build (failed.).
 * @returns
 */

const getCodePipelineFailedCodeBuildFlow = () => {
  const event: (
    | CodePipelineExecutionEvent
    | CodePipelineActionEvent
    | CodePipelineStageEvent
  )[] = [];

  /* ===========================================================*/
  /* 2022-04-02T11:21:38.925 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T11:21:29Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat-testing",
      "execution-id": "7df2c2e4-c471-494f-be80-5209902afe1f",
      stage: "Source",
      "execution-result": {
        "external-execution-url":
          "https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:000000000000:connection/0defde9e-8b96-474b-b276-459c07f5fafd&referenceType=COMMIT&FullRepositoryId=project/meerkat&Commit=eaa7f28a89218fbfa7faa63dab80e7d859689c33",
        "external-execution-summary":
          '{"ProviderType":"Bitbucket","CommitMessage":"fix broken deployment, now breaking the build again.\\n"}',
        "external-execution-id": "eaa7f28a89218fbfa7faa63dab80e7d859689c33",
      },
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "meerkat-artifact",
            key: "meerkat-testing/SourceArti/CZsm9fs",
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
    resources: [
      "arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat-testing",
    ],
    additionalAttributes: {},
  });
  /* ===========================================================*/
  /* 2022-04-02T11:28:47.640 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Pipeline Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T11:28:42Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat-testing",
      "execution-id": "7df2c2e4-c471-494f-be80-5209902afe1f",
      state: "FAILED",
      version: 16,
    },
    resources: [
      "arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat-testing",
    ],
    additionalAttributes: {
      failedActionCount: 1,
      failedActions: [
        {
          action: "Build",
          additionalInformation: "Build terminated with state: FAILED",
        },
      ],
      failedStage: "Build",
    },
  });
  /* ===========================================================*/
  /* 2022-04-02T11:28:49.286 */
  event.push({
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-04-02T11:28:42Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/ab499f2b2838ba3d9c9b5d0646396f70333f0644",
    detail: {
      pipeline: "meerkat-testing",
      "execution-id": "7df2c2e4-c471-494f-be80-5209902afe1f",
      stage: "Build",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat:0de10f6f-5fc5-45c0-9171-6333ffff564f/view/new",
        "external-execution-summary": "Build terminated with state: FAILED",
        "external-execution-id": "meerkat:0de10f6f-5fc5-45c0-9171-6333ffff564f",
        "error-code": "JobFailed",
      },
      action: "Build",
      state: "FAILED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeBuild",
        category: "Build",
        version: "1",
      },
      version: 16,
    },
    resources: [
      "arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat-testing",
    ],
    additionalAttributes: {
      additionalInformation: "Build terminated with state: FAILED",
    },
  });

  return event;
};
