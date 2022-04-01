import {
  CodePipelineExecutionEvent,
  CodePipelineStageEvent,
  CodePipelineActionEvent,
} from "../../../src/types/AwsCodePipeline";

/**
 * This file contains a collection of event data captured from a failed AWS Code Pipeline Execution with
 * failed AWS Code Deploy Actions.
 *
 * The pipeline contains three stages.
 * 1) Checkout Source Code.
 * 2) Building the Application with AWS Code Build.
 * 3) Deploying using AWS Code Deploy to three different deployment groups.

NOTE: Some events may be missing. The order of definitions is the order in which events were received.
It appears as if events can be processed out of order.

 */

export const PIPELINE_EXECUTION_START: CodePipelineExecutionEvent = {
  account: "000000000000",
  detailType: "CodePipeline Pipeline Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T22:56:21Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
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
  time: "2022-03-29T22:56:21Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
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
    time: "2022-03-29T22:56:21Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
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

export const PIPELINE_STAGE_SOURCE_ACTION_SOURCE_SUCCEEDED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T22:56:40Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "Source",
      "execution-result": {
        "external-execution-url":
          "https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:000000000000:connection/0defde9e-0000-0000-b276-459c07f5fafd&referenceType=COMMIT&FullRepositoryId=project/repository&Commit=8008b9ad2f440a0bb9d0c6872079a57f824a2fae",
        "external-execution-summary":
          '{"ProviderType":"Bitbucket","CommitMessage":"Break aws code deploy to capture failed events.\\n"}',
        "external-execution-id": "8008b9ad2f440a0bb9d0c6872079a57f824a2fae",
      },
      "output-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/SourceArti/qbAjebs",
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

export const PIPELINE_STAGE_SOURCE_SUCCEEDED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T22:56:40Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
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
    time: "2022-03-29T22:56:40Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "Build",
      action: "Build",
      "input-artifacts": [
        {
          name: "SourceArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/SourceArti/qbAjebs",
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
  time: "2022-03-29T22:56:40Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
    state: "STARTED",
    stage: "Build",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_DEPLOY_STARTED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T23:07:30Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
    state: "STARTED",
    stage: "DeployToExternalAccount",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_BUILD_SUCCEEDED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T23:07:30Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
    state: "SUCCEEDED",
    stage: "Build",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: { sourceActions: [] },
};

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_STARTED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:07:31Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "DeployToExternalAccount",
      action: "Deploy-GROUP_RED",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/BuildArtif/3ODHx3M",
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
    time: "2022-03-29T23:07:31Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "DeployToExternalAccount",
      action: "Deploy-GROUP_GREEN",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/BuildArtif/3ODHx3M",
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

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_BLUE_STARTED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:07:31Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "DeployToExternalAccount",
      action: "Deploy-GROUP_BLUE",
      "input-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/BuildArtif/3ODHx3M",
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

export const PIPELINE_STAGE_BUILD_ACTION_BUILD_SUCCEEDED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:07:30Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "Build",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:a440fc2d-7839-43e9-b960-a4c501d8c70c/view/new",
        "external-execution-id":
          "meerkat-testing:a440fc2d-7839-43e9-b960-a4c501d8c70c",
      },
      "output-artifacts": [
        {
          name: "BuildArtifact",
          s3location: {
            bucket: "project-bucket",
            key: "meerkat/BuildArtif/3ODHx3M",
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

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_FAILED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:13:13Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-C3XYEM1QF",
        "external-execution-summary": "Deployment d-C3XYEM1QF failed",
        "external-execution-id": "d-C3XYEM1QF",
        "error-code": "JobFailed",
      },
      action: "Deploy-GROUP_RED",
      state: "FAILED",
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
    additionalAttributes: {
      additionalInformation: "Deployment d-C3XYEM1QF failed",
    },
  };

export const PIPELINE_STAGE_DEPLOY_FAILED: CodePipelineStageEvent = {
  account: "000000000000",
  detailType: "CodePipeline Stage Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-03-29T23:13:13Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
  detail: {
    pipeline: "meerkat",
    "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
    state: "FAILED",
    stage: "DeployToExternalAccount",
    version: 16.0,
  },
  resources: ["arn:aws:codepipeline:ap-southeast-2:000000000000:meerkat"],
  additionalAttributes: {
    failedActionCount: 4,
    failedActions: [
      {
        action: "Deploy-GROUP_RED",
        additionalInformation: "Deployment d-C3XYEM1QF failed",
      },
      {
        action: "Deploy-GROUP_GREEN",
        additionalInformation: "Deployment d-8YX2HV1QF failed",
      },
      {
        action: "Deploy-GROUP_BLUE",
        additionalInformation: "Deployment d-2BBLC01QF failed",
      },
    ],
  },
};

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_GREEN_FAILED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:13:13Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-8YX2HV1QF",
        "external-execution-summary": "Deployment d-8YX2HV1QF failed",
        "external-execution-id": "d-8YX2HV1QF",
        "error-code": "JobFailed",
      },
      action: "Deploy-GROUP_GREEN",
      state: "FAILED",
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
    additionalAttributes: {
      additionalInformation: "Deployment d-8YX2HV1QF failed",
    },
  };

export const PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_BLUE_FAILED: CodePipelineActionEvent =
  {
    account: "000000000000",
    detailType: "CodePipeline Action Execution State Change",
    region: "ap-southeast-2",
    source: "aws.codepipeline",
    time: "2022-03-29T23:13:12Z",
    notificationRuleArn:
      "arn:aws:codestar-notifications:ap-southeast-2:000000000000:notificationrule/dc399f2b2838ba3d9c9b5d0646396f70333f0355",
    detail: {
      pipeline: "meerkat",
      "execution-id": "7705a421-5549-4b28-a4ad-2150fee793e8",
      stage: "DeployToExternalAccount",
      "execution-result": {
        "external-execution-url":
          "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-2BBLC01QF",
        "external-execution-summary": "Deployment d-2BBLC01QF failed",
        "external-execution-id": "d-2BBLC01QF",
        "error-code": "JobFailed",
      },
      action: "Deploy-GROUP_BLUE",
      state: "FAILED",
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
    additionalAttributes: {
      additionalInformation: "Deployment d-2BBLC01QF failed",
    },
  };
