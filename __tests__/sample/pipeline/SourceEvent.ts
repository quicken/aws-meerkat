import { CodePipelineActionEvent } from "../../../src/types/AwsCodePipeline";

/**
 * An example payload received for an AWS CodePipeline SOURCE Action Event coming from Bitbucket.
 */
export const PIPELINE_SOURCE_ACTION_BITBUCKET: CodePipelineActionEvent = {
  account: "111111111111",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2021-09-25T07:57:18Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:111111111111:notificationrule/b458395bbc1aa895fe86a3b3bf0aa7a71c9fb6a0",
  detail: {
    pipeline: "example-pipe-monitor-codepipeline",
    "execution-id": "a6bf7e98-2fd2-4977-aed8-c4abd047a8c0",
    stage: "Source",
    "execution-result": {
      "external-execution-url": `https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:111111111111:connection/&referenceType=COMMIT&FullRepositoryId=youraccount/yourproject.git&Commit=3fcdaa5ac3e29c79008319ede6c092643f204af0`,
      "external-execution-summary":
        '{"ProviderType":"BitBucket","CommitMessage":"The example pipeline now also creates the notification rules expected by\\nthe pipeline monitor."}',
      "external-execution-id": "f7ec85262da48e2b15d03037b138963c5a89d39f",
    },
    "output-artifacts": [
      {
        name: "SourceArtifact",
        s3location: {
          bucket: "www.somedomain.com",
          key: "example-pipe-monitor/SourceArti/ZHl5sz6",
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
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:111111111111:example-pipe-monitor-codepipeline",
  ],
  additionalAttributes: {},
};

/**
 * An example payload received for an AWS CodePipeline SOURCE Action Event coming from GitHub.
 */
export const PIPELINE_SOURCE_ACTION_GITHUB: CodePipelineActionEvent = {
  account: "111111111111",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2021-09-25T07:57:18Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:111111111111:notificationrule/b458395bbc1aa895fe86a3b3bf0aa7a71c9fffff",
  detail: {
    pipeline: "example-pipe-monitor-codepipeline",
    "execution-id": "a6bf7e98-2fd2-4977-aed8-c4abd047a8c0",
    stage: "Source",
    "execution-result": {
      "external-execution-url": `https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:111111111111:connection/11c9e&referenceType=COMMIT&FullRepositoryId=quicken/aws-code-pipeline-monitor&Commit=f7ec85262da48e2b15d03037b138963c5a89d39f`,
      "external-execution-summary":
        '{"ProviderType":"GitHub","CommitMessage":"The example pipeline now also creates the notification rules expected by\\nthe pipeline monitor."}',
      "external-execution-id": "f7ec85262da48e2b15d03037b138963c5a89ffff",
    },
    "output-artifacts": [
      {
        name: "SourceArtifact",
        s3location: {
          bucket: "www.somedomain.com",
          key: "example-pipe-monitor/SourceArti/ZHl5sz6",
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
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:111111111111:example-pipe-monitor-codepipeline",
  ],
  additionalAttributes: {},
};
