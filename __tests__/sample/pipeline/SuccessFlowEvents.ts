import {
  CodePipelineExecutionEvent,
  CodePipelineStageEvent,
  CodePipelineActionEvent,
} from "../../../src/types";

/**
 * This file contains a collection of event data captured from a Successfull AWS Code Pipeline Execution.
 *
 * The pipeline contains three stages.
 * 1) Checkout Source Code.
 * 2) Building the Application with AWS Code Build.
 * 3) Deploying using AWS Code Deploy to two different deployment groups.

NOTE: Some events may be missing. The order of definitions is the order in which events were received.
It appears as if events can be processed out of order.
 *
 */

export const PIPELINE_EXECUTION_START: CodePipelineExecutionEvent = {
  account: "000000000000",
  detailType: "CodePipeline Pipeline Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T22:38:40Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
    "execution-trigger": {
      "trigger-type": "Webhook",
      "trigger-detail":
        "arn:aws:codestar-connections:ap-southeast-2:000000000000:connection/0defde9e-0000-0000-b276-459c07f5fafd",
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
  time: "2022-03-29T22:38:40Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
    state: "STARTED",
    stage: "Source",
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
    time: "2022-03-29T22:38:40Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
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

export const PIPELINE_STAGE_BUILD_STARTED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T22:38:57Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
    state: "STARTED",
    stage: "Build",
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
  time: "2022-03-29T22:38:57Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
    state: "SUCCEEDED",
    stage: "Source",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_BUILD_ACTION_BUILD_STARTED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T22:38:58Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
      stage: "Build",
      action: "Build",
      "input-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/SourceArti/So1dgwm",
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

export const PIPELINE_STAGE_SOURCE_ACTION_SOURCE_SUCCEEDED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T22:38:57Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
      stage: "Source",
      "execution-result": {
        "external-execution-url":
          "https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:000000000000:connection/0defde9e-0000-0000-b276-459c07f5fafd&referenceType=COMMIT&FullRepositoryId=project/repository&Commit=1a104adf6a84de18fa3e3c4cb42b5024fe450ed5",
        "external-execution-summary":
          '{"ProviderType":"Bitbucket","CommitMessage":"Merge branches \'develop\' and \'develop\' of https://bitbucket.org/project/repository into develop\\n"}',
        "external-execution-id": "1a104adf6a84de18fa3e3c4cb42b5024fe450ed5",
      },
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/SourceArti/So1dgwm",
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
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_STAGE_BUILD_ACTION_BUILD_SUCCEEDED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T22:46:42Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
      stage: "Build",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:e91cf1d8-8089-478a-801d-3a8a7512773b/view/new",
        "external-execution-id":
          "meerkat-testing:e91cf1d8-8089-478a-801d-3a8a7512773b",
      },
      "output-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/BuildArtif/SeHtQm2",
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
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_STARTED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T22:49:51Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
      stage: "DeployToExternalAccount",
      action: "Deploy-RED",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/BuildArtif/SeHtQm2",
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
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_GREEN_STARTED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T22:49:52Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
      stage: "DeployToExternalAccount",
      action: "Deploy-GREEN",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/BuildArtif/SeHtQm2",
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
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_STAGE_DEPLOY_STARTED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T22:49:50Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
    state: "STARTED",
    stage: "DeployToExternalAccount",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_GREEN_SUCCEEDED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:04:17Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-GFBF8C0QF",
        "external-execution-summary": "Deployment Succeeded",
        "external-execution-id": "d-GFBF8C0QF",
      },
      action: "Deploy-GREEN",
      state: "SUCCEEDED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_SUCCEEDED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:04:18Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-PXMGWFFK3",
        "external-execution-summary": "Deployment Succeeded",
        "external-execution-id": "d-PXMGWFFK3",
      },
      action: "Deploy-RED",
      state: "SUCCEEDED",
      region: "ap-southeast-2",
      type: {
        owner: "AWS",
        provider: "CodeDeploy",
        category: "Deploy",
        version: "1",
      },
      version: 16.0,
    },
    resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
    additionalAttributes: {},
  };

export const PIPELINE_EXECUTION_SUCCEEDED: CodePipelineExecutionEvent = {
  account: "000000000000",
  detailType: "CodePipeline Pipeline Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T23:04:19Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
    state: "SUCCEEDED",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: {},
};

export const PIPELINE_STAGE_DEPLOY_SUCCEEDED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T23:04:19Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "f17023e4-eac9-4a52-8e9f-212e7a8d0d6e",
    state: "SUCCEEDED",
    stage: "DeployToExternalAccount",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};
