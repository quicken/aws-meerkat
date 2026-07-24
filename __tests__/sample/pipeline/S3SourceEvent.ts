import { CodePipelineActionEvent } from "../../../src/types/AwsCodePipeline";

/**
 * An S3 source action event for a versioned deployment (e.g. stg/prd).
 * S3 object key: my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip
 */
export const PIPELINE_S3_SOURCE_VERSIONED: CodePipelineActionEvent = {
  account: "222222222222",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2026-07-01T10:30:00Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:222222222222:notificationrule/abc123",
  detail: {
    pipeline: "my-deploy-pipeline",
    "execution-id": "b7fc9e12-3ab4-5678-cdef-123456789abc",
    stage: "Source",
    "execution-result": {
      "external-execution-url":
        "https://ap-southeast-2.console.aws.amazon.com/s3/object/my-artifact-bucket?prefix=my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip",
      "external-execution-id": "abc123def456.version-id",
    },
    "output-artifacts": [
      {
        name: "SourceArtifact",
        s3location: {
          bucket: "my-artifact-bucket",
          key: "my-deploy-pipeline/my-deploy-pipeline-1.4.2.zip",
        },
      },
    ],
    action: "S3Source",
    state: "SUCCEEDED",
    region: "ap-southeast-2",
    type: {
      owner: "AWS",
      provider: "S3",
      category: "Source",
      version: "1",
    },
    version: 16.0,
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:222222222222:my-deploy-pipeline",
  ],
  additionalAttributes: {},
};

/**
 * An S3 source action event for a "latest" deployment (e.g. tst auto-deploy).
 * S3 object key: my-deploy-pipeline/my-deploy-pipeline-latest.zip
 */
export const PIPELINE_S3_SOURCE_LATEST: CodePipelineActionEvent = {
  account: "111111111111",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2026-07-01T10:00:00Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:111111111111:notificationrule/def456",
  detail: {
    pipeline: "my-deploy-pipeline",
    "execution-id": "c8ad0f23-4bc5-6789-def0-234567890bcd",
    stage: "Source",
    "execution-result": {
      "external-execution-url":
        "https://ap-southeast-2.console.aws.amazon.com/s3/object/my-artifact-bucket?prefix=my-deploy-pipeline/my-deploy-pipeline-latest.zip",
      "external-execution-id": "xyz789.version-id",
    },
    "output-artifacts": [
      {
        name: "SourceArtifact",
        s3location: {
          bucket: "my-artifact-bucket",
          key: "my-deploy-pipeline/my-deploy-pipeline-latest.zip",
        },
      },
    ],
    action: "S3Source",
    state: "SUCCEEDED",
    region: "ap-southeast-2",
    type: {
      owner: "AWS",
      provider: "S3",
      category: "Source",
      version: "1",
    },
    version: 16.0,
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:111111111111:my-deploy-pipeline",
  ],
  additionalAttributes: {},
};

/**
 * An S3 source action event that has FAILED.
 */
export const PIPELINE_S3_SOURCE_FAILED: CodePipelineActionEvent = {
  account: "222222222222",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2026-07-01T10:30:00Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:222222222222:notificationrule/abc123",
  detail: {
    pipeline: "my-deploy-pipeline",
    "execution-id": "d9be1g34-5cd6-7890-ef01-345678901cde",
    stage: "Source",
    "execution-result": {
      "external-execution-url": "",
      "external-execution-id": "",
      "external-execution-summary":
        "The specified S3 object key does not exist: my-deploy-pipeline/my-deploy-pipeline-9.9.9.zip",
    },
    "output-artifacts": [],
    action: "S3Source",
    state: "FAILED",
    region: "ap-southeast-2",
    type: {
      owner: "AWS",
      provider: "S3",
      category: "Source",
      version: "1",
    },
    version: 16.0,
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:222222222222:my-deploy-pipeline",
  ],
  additionalAttributes: {},
};

/**
 * An S3 source action event with no output-artifacts (edge case, fallback to execution-result).
 */
export const PIPELINE_S3_SOURCE_NO_ARTIFACTS: CodePipelineActionEvent = {
  account: "333333333333",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2026-07-01T11:00:00Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:333333333333:notificationrule/ghi789",
  detail: {
    pipeline: "my-api-pipeline",
    "execution-id": "e0cf2h45-6de7-8901-fg12-456789012def",
    stage: "Source",
    "execution-result": {
      "external-execution-url": "",
      "external-execution-id": "my-api-pipeline/my-api-pipeline-2.0.1.zip",
    },
    action: "S3Source",
    state: "SUCCEEDED",
    region: "ap-southeast-2",
    type: {
      owner: "AWS",
      provider: "S3",
      category: "Source",
      version: "1",
    },
    version: 16.0,
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:333333333333:my-api-pipeline",
  ],
  additionalAttributes: {},
};
