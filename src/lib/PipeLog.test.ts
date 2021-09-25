import "dotenv/config";
import { PipeLog } from "./PipeLog";
import { BitBucket } from "./BitBucket";
import { GitHub } from "./GitHub";

const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";
const GIT_USERNAME = process.env.GIT_USERNAME || "";
const GIT_PASSWORD = process.env.GIT_PASSWORD || "";
const TEST_GITHUB_USERNAME = process.env.TEST_GITHUB_USERNAME || "";
const TEST_GITHUB_TOKEN = process.env.TEST_GITHUB_TOKEN || "";
const TEST_GITHUB_AUTHOR = process.env.TEST_GITHUB_AUTHOR || "";
const TEST_GITHUB_REPO = process.env.TEST_GITHUB_REPO || "";
const TEST_GITHUB_COMMIT = process.env.TEST_GITHUB_COMMIT || "";
const TEST_BITBUCKET_AUTHOR = process.env.TEST_BITBUCKET_AUTHOR || "";
const TEST_BITBUCKET_COMMIT = process.env.TEST_BITBUCKET_COMMIT || "";
const TEST_BITBUCKET_REPO = process.env.TEST_BITBUCKET_REPO || "";

test("action-commit-bitbucket", async () => {
  const bitBucket = new BitBucket(GIT_USERNAME, GIT_PASSWORD);

  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  await pipelog.handlePipelineAction(checkoutBitbucketSourceAction);

  expect(pipelog.commit.author).toBe(TEST_BITBUCKET_AUTHOR);
});

test("action-commit-github", async () => {
  const gitHub = new GitHub(TEST_GITHUB_USERNAME, TEST_GITHUB_TOKEN);

  const pipelog = new PipeLog(DB_TABLE, gitHub);
  await pipelog.handlePipelineAction(checkoutGitHubSourceAction);

  expect(pipelog.commit.author).toBe(TEST_GITHUB_AUTHOR);
});

const checkoutBitbucketSourceAction = {
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
      "external-execution-url": `https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:111111111111:connection/&referenceType=COMMIT&FullRepositoryId=${TEST_BITBUCKET_REPO}&Commit=${TEST_BITBUCKET_COMMIT}`,
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
    version: 1.0,
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:111111111111:example-pipe-monitor-codepipeline",
  ],
  additionalAttributes: {},
};

const checkoutGitHubSourceAction = {
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
      "external-execution-url": `https://ap-southeast-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:ap-southeast-2:111111111111:connection/11c9e&referenceType=COMMIT&FullRepositoryId=${TEST_GITHUB_REPO}&Commit=${TEST_GITHUB_COMMIT}`,
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
    version: 1.0,
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:111111111111:example-pipe-monitor-codepipeline",
  ],
  additionalAttributes: {},
};
