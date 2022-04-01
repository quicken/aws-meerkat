import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
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

import { BitBucket } from "../src/lib/BitBucket";
import { CodeBuild } from "../src/lib/CodeBuild";
import { CodeDeploy } from "../src/lib/CodeDeploy";
import { PipeLog } from "../src/lib/PipeLog";
import { CommitType } from "../src/types";
import { CodePipelineBot } from "../src/CodePipelineBot";

import {
  PIPELINE_EXECUTION_STARTED,
  PIPELINE_STAGE_BUILD_STARTED,
  PIPELINE_STAGE_SOURCE_ACTION_SOURCE_STARTED,
} from "./sample/pipeline/FailedBuildFlow";

import { AWS_LIST_TARGETS, AWS_BATCH_TARGETS } from "./sample/aws/codeDeploy";
import { SAMPLE_BATCH_BUILDS } from "./sample/aws/codeBuild";
import { ITEM_FAILED_DEPLOYMENT_PIPE_LOG } from "./sample/aws/dynamoDb";

const DB_TABLE = "devops-pipeline-monitor";

const dynamoDbMock = mockClient(DynamoDBClient) as any;
const codeBuildMock = mockClient(CodeBuildClient) as any;
const codeDeployMock = mockClient(CodeDeployClient) as any;

jest.mock("../src/lib/BitBucket", () => {
  return {
    BitBucket: jest.fn().mockImplementation(() => {
      return {
        fetchCommit: (repo: string, commitId: string): Promise<CommitType> => {
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

beforeEach(() => {
  dynamoDbMock.reset();
  codeBuildMock.reset();
  codeDeployMock.reset();
});

test("deploy_arn_env_filters", async () => {
  const mock = {
    DEPLOY_ARN: "arn:default",
    DEPLOY_ARN_testing_env: "arn:testing",
    DEPLOY_ARN_ProducTion: "arn:production",
  };

  expect(CodePipelineBot.getDeployArnFromEnv("some_non_matching", mock)).toBe(
    "arn:default"
  );

  expect(
    CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)
  ).toBe("arn:testing");

  expect(CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe(
    "arn:default"
  );

  expect(CodePipelineBot.getDeployArnFromEnv("production_matching", mock)).toBe(
    "arn:production"
  );
});

test("deploy_arn_no_default", async () => {
  const mock = {
    DEPLOY_ARN_testing_env: "arn:testing",
    DEPLOY_ARN_ProducTion: "arn:production",
  };

  expect(CodePipelineBot.getDeployArnFromEnv("some_non_matching", mock)).toBe(
    ""
  );

  expect(
    CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)
  ).toBe("arn:testing");

  expect(CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe(
    ""
  );

  expect(CodePipelineBot.getDeployArnFromEnv("production_matching", mock)).toBe(
    "arn:production"
  );
});

test("default_only", async () => {
  const mock = {
    DEPLOY_ARN: "arn:testing",
  };

  expect(CodePipelineBot.getDeployArnFromEnv("some_non_matching", mock)).toBe(
    "arn:testing"
  );

  expect(
    CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)
  ).toBe("arn:testing");

  expect(CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe(
    "arn:testing"
  );

  expect(CodePipelineBot.getDeployArnFromEnv("production_matching", mock)).toBe(
    "arn:testing"
  );
});

test("missing_opt", async () => {
  const mock = {
    FOO: "Bar",
  };

  expect(CodePipelineBot.getDeployArnFromEnv("some_non_matching", mock)).toBe(
    ""
  );

  expect(
    CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)
  ).toBe("");

  expect(CodePipelineBot.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe(
    ""
  );

  expect(CodePipelineBot.getDeployArnFromEnv("production_matching", mock)).toBe(
    ""
  );
});

test("detectEvent_unknown", () => {
  const type = CodePipelineBot.detectEventType({ foo: "bar" });
  expect(type).toBe("");
});

test("detectEvent_pipeline_execution", () => {
  const type = CodePipelineBot.detectEventType(PIPELINE_EXECUTION_STARTED);
  expect(type).toBe("CodePipelineExecutionEvent");
});

test("detectEvent_pipeline_stage", () => {
  const type = CodePipelineBot.detectEventType(PIPELINE_STAGE_BUILD_STARTED);
  expect(type).toBe("CodePipelineStageEvent");
});

test("detectEvent_pipeline_action", () => {
  const type = CodePipelineBot.detectEventType(
    PIPELINE_STAGE_SOURCE_ACTION_SOURCE_STARTED
  );
  expect(type).toBe("CodePipelineActionEvent");
});

test("createPipelineNotification_failed_deployment", async () => {
  dynamoDbMock.on(GetItemCommand).resolves(ITEM_FAILED_DEPLOYMENT_PIPE_LOG);
  codeBuildMock.on(BatchGetBuildsCommand).resolves(SAMPLE_BATCH_BUILDS);
  codeDeployMock.on(ListDeploymentTargetsCommand).resolves(AWS_LIST_TARGETS);
  codeDeployMock
    .on(BatchGetDeploymentTargetsCommand)
    .resolves(AWS_BATCH_TARGETS);

  const pipeLog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);
  await pipeLog.load("mock");

  const codeDeployArn = CodePipelineBot.getDeployArnFromEnv(
    pipeLog.name,
    process.env
  );

  const codeBuild = new CodeBuild(codeBuildMock);
  const codeDeploy = new CodeDeploy(codeDeployMock);
  const bot = new CodePipelineBot(pipeLog, codeBuild, codeDeploy);

  const notification = await bot.createPipelineNotification(pipeLog);

  expect(notification.name).toBe("meerkat");
  expect(notification.successfull).toBe(false);
  expect(notification.failureDetail?.type).toBe("CodeDeploy");
});

const pseudo_implementation = async () => {
  const pipelog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);
  const deployArn = CodePipelineBot.getDeployArnFromEnv(
    pipelog.name,
    process.env
  );
  const codeDeployConfig = await CodeDeploy.createClientConfig(deployArn);

  const codeDeploy = new CodeDeploy(new CodeDeployClient(codeDeployConfig));
  const codeBuild = new CodeBuild(new CodeBuildClient({}));
  const pipebot = new CodePipelineBot(pipelog, codeBuild, codeDeploy);

  //const notification = await pipebot.handleEvent({});
};
