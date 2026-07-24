import {
  CodePipelineClient,
  ListActionExecutionsCommand,
} from "@aws-sdk/client-codepipeline";
import { mockClient } from "aws-sdk-client-mock";
import { CodePipeline } from "../../src/lib/CodePipeline";

const codePipelineMock = mockClient(CodePipelineClient) as any;

beforeEach(() => {
  codePipelineMock.reset();
});

test("fetchS3SourceKey_returns_resolved_S3ObjectKey", async () => {
  codePipelineMock.on(ListActionExecutionsCommand).resolves({
    actionExecutionDetails: [
      {
        stageName: "Deploy",
        actionName: "LambdaDeploy",
        input: {
          actionTypeId: {
            category: "Invoke",
            owner: "AWS",
            provider: "Lambda",
            version: "1",
          },
        },
        output: {},
      },
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
            S3Bucket: "my-artifact-bucket",
            S3ObjectKey: "my-deploy-pipeline/my-deploy-pipeline-latest.zip",
          },
          resolvedConfiguration: {
            S3Bucket: "my-artifact-bucket",
            S3ObjectKey: "my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip",
          },
        },
        output: {
          outputVariables: {
            BucketName: "my-artifact-bucket",
            ObjectKey: "my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip",
            VersionId: "abc123",
          },
        },
      },
    ],
  });

  const codePipeline = new CodePipeline(codePipelineMock);
  const key = await codePipeline.fetchS3SourceKey(
    "my-deploy-pipeline",
    "exec-123",
  );

  expect(key).toBe("my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip");
});

test("fetchS3SourceKey_falls_back_to_resolvedConfiguration", async () => {
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
            S3ObjectKey: "app/app-latest.zip",
          },
          resolvedConfiguration: {
            S3ObjectKey: "app/app-2.0.0.zip",
          },
        },
        output: {
          // No outputVariables
        },
      },
    ],
  });

  const codePipeline = new CodePipeline(codePipelineMock);
  const key = await codePipeline.fetchS3SourceKey("my-pipeline", "exec-456");

  expect(key).toBe("app/app-2.0.0.zip");
});

test("fetchS3SourceKey_falls_back_to_static_configuration", async () => {
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
            S3ObjectKey: "app/app-latest.zip",
          },
          // No resolvedConfiguration
        },
        output: {
          // No outputVariables
        },
      },
    ],
  });

  const codePipeline = new CodePipeline(codePipelineMock);
  const key = await codePipeline.fetchS3SourceKey("my-pipeline", "exec-789");

  expect(key).toBe("app/app-latest.zip");
});

test("fetchS3SourceKey_returns_empty_when_no_s3_source", async () => {
  codePipelineMock.on(ListActionExecutionsCommand).resolves({
    actionExecutionDetails: [
      {
        stageName: "Source",
        actionName: "CodeStarSource",
        input: {
          actionTypeId: {
            category: "Source",
            owner: "AWS",
            provider: "CodeStarSourceConnection",
            version: "1",
          },
        },
        output: {},
      },
    ],
  });

  const codePipeline = new CodePipeline(codePipelineMock);
  const key = await codePipeline.fetchS3SourceKey("my-pipeline", "exec-000");

  expect(key).toBe("");
});

test("fetchS3SourceKey_returns_empty_when_no_action_details", async () => {
  codePipelineMock.on(ListActionExecutionsCommand).resolves({
    actionExecutionDetails: undefined,
  });

  const codePipeline = new CodePipeline(codePipelineMock);
  const key = await codePipeline.fetchS3SourceKey("my-pipeline", "exec-111");

  expect(key).toBe("");
});

test("fetchS3SourceKey_prefers_outputVariables_over_sentinel_resolvedConfig", async () => {
  // Scenario: pipeline has a sentinel placeholder in config,
  // but the actual key used is in outputVariables
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
            S3ObjectKey: "__no_release_change__/override-required",
          },
          resolvedConfiguration: {
            S3ObjectKey: "__no_release_change__/override-required",
          },
        },
        output: {
          outputVariables: {
            BucketName: "my-artifact-bucket",
            ObjectKey: "my-app/my-app-1.0.0.zip",
            VersionId: "abc123versionid",
          },
        },
      },
    ],
  });

  const codePipeline = new CodePipeline(codePipelineMock);
  const key = await codePipeline.fetchS3SourceKey("my-app", "exec-tagged");

  expect(key).toBe("my-app/my-app-1.0.0.zip");
});

test("fetchS3SourceKey_sends_correct_filter", async () => {
  codePipelineMock.on(ListActionExecutionsCommand).resolves({
    actionExecutionDetails: [],
  });

  const codePipeline = new CodePipeline(codePipelineMock);
  await codePipeline.fetchS3SourceKey("my-pipe", "my-exec-id");

  const call = codePipelineMock.commandCalls(ListActionExecutionsCommand)[0];
  expect(call.args[0].input).toEqual({
    pipelineName: "my-pipe",
    filter: {
      pipelineExecutionId: "my-exec-id",
    },
  });
});
