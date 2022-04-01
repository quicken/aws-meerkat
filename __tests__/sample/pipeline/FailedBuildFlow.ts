import {
  CodePipelineActionEvent,
  CodePipelineStageEvent,
  CodePipelineExecutionEvent,
} from "../../../src/types/AwsCodePipeline";

/**
 * This file contains a collection of event data captured from a failed AWS Code Pipeline Execution with
 * failed AWS Code Build Actions.
 *
 * The pipeline contains three stages.
 * 1) Checkout Source Code.
 * 2) Building the Application with AWS Code Build.
 * 3) Deploying using AWS Code Deploy to three different deployment groups.

NOTE: Some events may be missing. The order of definitions is the order in which events were received.
It appears as if events can be processed out of order.

 */

export const PIPELINE_STAGE_BUILD_ACTION_BUILD_STARTED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-30T08:52:49Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
      stage: "Build",
      action: "Build",
      "input-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/SourceArti/QS4E7gR",
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
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_STAGE_BUILD_STARTED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-30T08:52:49Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
    state: "STARTED",
    stage: "Build",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_SOURCE_ACTION_SOURCE_STARTED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-30T08:52:30Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
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
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_EXECUTION_STARTED: CodePipelineExecutionEvent = {
  account: "000000000000",
  detailType: "CodePipeline Pipeline Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-30T08:52:29Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
    "execution-trigger": {
      "trigger-type": "Webhook",
      "trigger-detail":
        "arn:aws:codestar-connections:ap-southeast-2:000000000000:connection/0defde9e-8b96-474b-b276-459c07f5fafd",
    },
    state: "STARTED",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: {},
};

export const PIPELINE_STAGE_SOURCE_STARTED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-30T08:52:29Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
    state: "STARTED",
    stage: "Source",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_SOURCE_SUCCEEDED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-30T08:52:49Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
    state: "SUCCEEDED",
    stage: "Source",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-30T09:07:15Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
      stage: "Build",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad/view/new",
        "external-execution-summary": "Build terminated with state: FAILED",
        "external-execution-id":
          "meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad",
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
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {
      additionalInformation: "Build terminated with state: FAILED",
    },
  };

export const PIPELINE_EXECUTION_FAILED: CodePipelineExecutionEvent = {
  account: "000000000000",
  detailType: "CodePipeline Pipeline Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-30T09:07:15Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
    state: "FAILED",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
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
};

export const PIPELINE_STAGE_BUILD_FAILED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-30T09:07:15Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "94fb261b-65d0-41ba-bea3-b08420e9b5e7",
    state: "FAILED",
    stage: "Build",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: {
    failedActionCount: 1,
    failedActions: [
      {
        action: "Build",
        additionalInformation: "Build terminated with state: FAILED",
      },
    ],
  },
};
