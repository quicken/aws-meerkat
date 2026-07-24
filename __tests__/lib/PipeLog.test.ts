import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import { PipeLog } from "../../src/lib/PipeLog";
import { BitBucket } from "../../src/lib/BitBucket";
import { GitHub } from "../../src/lib/GitHub";
import { Commit, LogEntry } from "../../src/types/common";
import { PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED } from "../sample/pipeline/FailedBuildFlow";
import { PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_FAILED } from "../sample/pipeline/FailedDeploymentFlow";
import {
  PIPELINE_SOURCE_ACTION_BITBUCKET,
  PIPELINE_SOURCE_ACTION_GITHUB,
} from "../sample/pipeline/SourceEvent";

import {
  PIPELINE_S3_SOURCE_VERSIONED,
  PIPELINE_S3_SOURCE_LATEST,
  PIPELINE_S3_SOURCE_FAILED,
  PIPELINE_S3_SOURCE_NO_ARTIFACTS,
} from "../sample/pipeline/S3SourceEvent";

import { ITEM_FAILED_DEPLOYMENT_PIPE_LOG } from "../sample/aws/dynamoDb";

const dynamoDbMock = mockClient(DynamoDBClient) as any;

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

jest.mock("../../src/lib/GitHub", () => {
  return {
    GitHub: jest.fn().mockImplementation(() => {
      return {
        fetchCommit: (repo: string, commitId: string): Promise<Commit> => {
          return new Promise((resolve, reject) => {
            resolve({
              id: "f7ec85262da48e2b15d03037b138963c5a89d39f",
              author: "marcel <mscherzer@gmail.com>",
              summary:
                "The example pipeline now also creates the notification rules expected by\n" +
                "the pipeline monitor.",
              link: "https://github.com/quicken/aws-meerkat/commit/f7ec85262da48e2b15d03037b138963c5a89d39f",
            });
          });
        },
      };
    }),
  };
});

beforeEach(() => {
  dynamoDbMock.reset();
});

const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";

test("get_failed_gt_one", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_BITBUCKET);
  await pipelog.handlePipelineAction(PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED);
  await pipelog.handlePipelineAction(
    PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_FAILED
  );

  const FIRST_FAILED = pipelog.failed;

  if (FIRST_FAILED) {
    expect(FIRST_FAILED.id).toBe(
      "meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad"
    );
    expect(FIRST_FAILED.name).toBe("Build");
    expect(FIRST_FAILED.type).toBe("build");
    expect(FIRST_FAILED.summary).toBe(undefined);
    expect(FIRST_FAILED.link).toBe(
      "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad/view/new"
    );
  } else {
    expect(FIRST_FAILED).not.toEqual(null);
  }
});

test("get_failed_is_empty", () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);

  expect(pipelog.failed).toBe(null);
});

test("get_is_failed_true", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED);
  expect(pipelog.isFailed).toBe(true);
});

test("get_is_failed_false", () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);
  expect(pipelog.isFailed).toBe(false);
});

test("handleCodeStarConnection_BITBUCKET_succeeded", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_BITBUCKET);

  expect(pipelog.commit.author).toBe("Marcel Scherzet <mscherzer@gmail.com>");
});

test("handleCodeStarConnection_BITBUCKET_succeeded", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_BITBUCKET);

  expect(pipelog.commit.author).toBe("Marcel Scherzet <mscherzer@gmail.com>");
});

test("handleCodeStarConnection_GITHUB_succeeded", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_GITHUB);

  expect(pipelog.commit.author).toBe("marcel <mscherzer@gmail.com>");
});

test("handleCodeBuildEvent_failed", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED);

  const FAILED = pipelog.failed
    ? pipelog.failed
    : ({ id: "", type: "unknown", name: "" } as LogEntry);

  expect(FAILED.id).toBe(
    "meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad"
  );
  expect(FAILED.name).toBe("Build");
  expect(FAILED.type).toBe("build");
  expect(FAILED.summary).toBe(undefined);
  expect(FAILED.link).toBe(
    "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad/view/new"
  );
});

test("handleCodeDeployActionEvent_failed", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(
    PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_FAILED
  );

  const FAILED = pipelog.failed
    ? pipelog.failed
    : ({ id: "", type: "unknown", name: "" } as LogEntry);

  expect(FAILED.id).toBe("d-C3XYEM1QF");
  expect(FAILED.name).toBe("Deploy-GROUP_RED");
  expect(FAILED.type).toBe("deploy");
  expect(FAILED.summary).toBe("Deployment d-C3XYEM1QF failed");
  expect(FAILED.link).toBe(
    "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-C3XYEM1QF"
  );
});

test("loading", async () => {
  dynamoDbMock.on(GetItemCommand).resolves(ITEM_FAILED_DEPLOYMENT_PIPE_LOG);

  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.load("mock");
  expect(pipelog.isFailed).toBe(true);
  expect(pipelog.failed?.name).toBe("Deploy-RED");
  expect(pipelog.failed?.type).toBe("deploy");
});

// --- S3 Source Action Tests ---

test("handleS3ActionEvent_versioned_extracts_semver", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_S3_SOURCE_VERSIONED);

  expect(pipelog.commit.id).toBe("1.4.2");
  expect(pipelog.commit.author).toBe("");
  expect(pipelog.commit.summary).toBe("my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip");
  expect(pipelog.commit.link).toBe("");
});

test("handleS3ActionEvent_latest_extracts_latest", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_S3_SOURCE_LATEST);

  expect(pipelog.commit.id).toBe("latest");
  expect(pipelog.commit.author).toBe("");
  expect(pipelog.commit.summary).toBe("my-deploy-pipeline/my-deploy-pipeline-latest.zip");
  expect(pipelog.commit.link).toBe("");
});

test("handleS3ActionEvent_failed_records_failure", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_S3_SOURCE_FAILED);

  expect(pipelog.isFailed).toBe(true);
  expect(pipelog.failed?.type).toBe("checkout");
  expect(pipelog.failed?.name).toBe("S3Source");
  expect(pipelog.failed?.message).toBe(
    "The specified S3 object key does not exist: my-deploy-pipeline/my-deploy-pipeline-9.9.9.zip"
  );
});

test("handleS3ActionEvent_no_output_artifacts_falls_back_to_execution_id", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_S3_SOURCE_NO_ARTIFACTS);

  expect(pipelog.commit.id).toBe("2.0.1");
  expect(pipelog.commit.author).toBe("");
  expect(pipelog.commit.summary).toBe("my-api-pipeline/my-api-pipeline-2.0.1.zip");
  expect(pipelog.commit.link).toBe("");
});

test("handleS3ActionEvent_custom_version_pattern", async () => {
  const gitHub = new GitHub("", "");
  // Custom pattern: extract version from "v{version}" prefix format
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock, "v([\\d.]+)\\.zip$");
  
  // Create a custom event with different key format
  const customEvent = {
    ...PIPELINE_S3_SOURCE_VERSIONED,
    detail: {
      ...PIPELINE_S3_SOURCE_VERSIONED.detail,
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "my-bucket",
            key: "releases/app-v3.2.1.zip",
          },
        },
      ],
    },
  };

  await pipelog.handlePipelineAction(customEvent);

  expect(pipelog.commit.id).toBe("3.2.1");
  expect(pipelog.commit.summary).toBe("releases/app-v3.2.1.zip");
});

test("handleS3ActionEvent_no_pattern_match_returns_full_key", async () => {
  const gitHub = new GitHub("", "");
  // Use a pattern that won't match the key
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock, "NOMATCH(\\d+)");
  
  const customEvent = {
    ...PIPELINE_S3_SOURCE_VERSIONED,
    detail: {
      ...PIPELINE_S3_SOURCE_VERSIONED.detail,
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "my-bucket",
            key: "some/unusual/path/artifact.tar.gz",
          },
        },
      ],
    },
  };

  await pipelog.handlePipelineAction(customEvent);

  // When pattern doesn't match, id falls back to the full key
  expect(pipelog.commit.id).toBe("some/unusual/path/artifact.tar.gz");
  expect(pipelog.commit.summary).toBe("");
});

test("handleS3ActionEvent_sets_pipeline_name", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);
  await pipelog.handlePipelineAction(PIPELINE_S3_SOURCE_VERSIONED);

  expect(pipelog.name).toBe("my-deploy-pipeline");
});

// --- S3 Source with ListActionExecutions API Tests ---

import {
  CodePipelineClient,
  ListActionExecutionsCommand,
} from "@aws-sdk/client-codepipeline";
import { CodePipeline } from "../../src/lib/CodePipeline";

const codePipelineMock = mockClient(CodePipelineClient) as any;

test("handleS3ActionEvent_uses_api_when_codePipeline_provided", async () => {
  codePipelineMock.reset();
  codePipelineMock.on(ListActionExecutionsCommand).resolves({
    actionExecutionDetails: [
      {
        stageName: "Source",
        actionName: "S3Source",
        input: {
          actionTypeId: {
            category: "Source",
            owner: "AWS",
            provider: "S3",
            version: "1",
          },
          resolvedConfiguration: {
            S3Bucket: "my-artifact-bucket",
            S3ObjectKey: "my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip",
          },
        },
        output: {
          outputVariables: {
            ObjectKey: "my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip",
          },
        },
      },
    ],
  });

  const gitHub = new GitHub("", "");
  const codePipeline = new CodePipeline(codePipelineMock);
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock, undefined, codePipeline);

  // Use an event with a CACHE path in output-artifacts (simulates real cross-account behaviour)
  const crossAccountEvent = {
    ...PIPELINE_S3_SOURCE_VERSIONED,
    detail: {
      ...PIPELINE_S3_SOURCE_VERSIONED.detail,
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "deploy-cache.tst.example.com",
            key: "my-deploy-pipeline/SourceArti/MjPeWp2.zip", // Cache path, NOT real key
          },
        },
      ],
    },
  };

  await pipelog.handlePipelineAction(crossAccountEvent);

  // Should use the API result, not the event's cache path
  expect(pipelog.commit.id).toBe("1.4.2");
  expect(pipelog.commit.summary).toBe("my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip");
});

test("handleS3ActionEvent_falls_back_to_event_when_api_fails", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  codePipelineMock.reset();
  codePipelineMock.on(ListActionExecutionsCommand).rejects(
    new Error("Access Denied"),
  );

  const gitHub = new GitHub("", "");
  const codePipeline = new CodePipeline(codePipelineMock);
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock, undefined, codePipeline);

  await pipelog.handlePipelineAction(PIPELINE_S3_SOURCE_VERSIONED);

  // Falls back to event payload data
  expect(pipelog.commit.id).toBe("1.4.2");
  expect(pipelog.commit.summary).toBe("my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip");
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringContaining("Failed to fetch S3 source key via API"),
    expect.any(Error),
  );
  errorSpy.mockRestore();
});

test("handleS3ActionEvent_falls_back_to_event_when_api_returns_empty", async () => {
  codePipelineMock.reset();
  codePipelineMock.on(ListActionExecutionsCommand).resolves({
    actionExecutionDetails: [],
  });

  const gitHub = new GitHub("", "");
  const codePipeline = new CodePipeline(codePipelineMock);
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock, undefined, codePipeline);

  await pipelog.handlePipelineAction(PIPELINE_S3_SOURCE_LATEST);

  // Falls back to event payload
  expect(pipelog.commit.id).toBe("latest");
  expect(pipelog.commit.summary).toBe("my-deploy-pipeline/my-deploy-pipeline-latest.zip");
});

test("handleS3ActionEvent_api_returns_overridden_key_for_versioned_deploy", async () => {
  codePipelineMock.reset();
  // Simulates stg/prd: pipeline's default key is "latest" but execution was overridden to a specific version
  codePipelineMock.on(ListActionExecutionsCommand).resolves({
    actionExecutionDetails: [
      {
        stageName: "Source",
        actionName: "S3Source",
        input: {
          actionTypeId: {
            category: "Source",
            owner: "AWS",
            provider: "S3",
            version: "1",
          },
          configuration: {
            S3ObjectKey: "my-deploy-pipeline/my-deploy-pipeline-latest.zip", // Default config
          },
          resolvedConfiguration: {
            S3ObjectKey: "my-deploy-pipeline/my-deploy-pipeline-2.3.1.zip", // Override for this execution
          },
        },
        output: {},
      },
    ],
  });

  const gitHub = new GitHub("", "");
  const codePipeline = new CodePipeline(codePipelineMock);
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock, undefined, codePipeline);

  // Event has cache path (doesn't matter — API will be used)
  const event = {
    ...PIPELINE_S3_SOURCE_LATEST,
    detail: {
      ...PIPELINE_S3_SOURCE_LATEST.detail,
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "deploy-cache.stg.example.com",
            key: "my-deploy-pipeline/SourceArti/XyZ123.zip",
          },
        },
      ],
    },
  };

  await pipelog.handlePipelineAction(event);

  // Should show the overridden version, not "latest"
  expect(pipelog.commit.id).toBe("2.3.1");
  expect(pipelog.commit.summary).toBe("my-deploy-pipeline/my-deploy-pipeline-2.3.1.zip");
});

test("handleS3ActionEvent_rejects_cache_path_when_no_api", async () => {
  const gitHub = new GitHub("", "");
  // No CodePipeline client — will fall back to event payload
  const pipelog = new PipeLog(DB_TABLE, gitHub, dynamoDbMock);

  // Simulate the real cross-account event with cache path in output-artifacts
  const cachePathEvent = {
    ...PIPELINE_S3_SOURCE_LATEST,
    detail: {
      ...PIPELINE_S3_SOURCE_LATEST.detail,
      "execution-result": {
        "external-execution-url": "",
        "external-execution-id": "1LTS101wrm35oyRVexDi3IvmLJS6Shr4", // S3 version ID
        "external-execution-summary": "Amazon S3 version id: 1LTS101wrm35oyRVexDi3IvmLJS6Shr4",
      },
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "deploy-cache.tst.example.com",
            key: "my-deploy-pipeline/SourceArti/Dcky8tB.zip", // Cache path
          },
        },
      ],
    },
  };

  await pipelog.handlePipelineAction(cachePathEvent);

  // Should NOT show cache path — commit.id should be empty
  expect(pipelog.commit.id).toBe("");
  expect(pipelog.commit.summary).toBe("");
});
