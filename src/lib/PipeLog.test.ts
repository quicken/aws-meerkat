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
const TEST_BITBUCKET_AUTHOR = process.env.TEST_BITBUCKET_AUTHOR || "";
const TEST_BITBUCKET_COMMIT = process.env.TEST_BITBUCKET_COMMIT || "";
const TEST_BITBUCKET_REPO = process.env.TEST_BITBUCKET_REPO || "";

test("action-commit-bitbucket", async () => {
  const bitBucket = new BitBucket(GIT_USERNAME, GIT_PASSWORD);

  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  await pipelog.handleEvent(checkoutFromBitbucketEvent());

  expect(pipelog.commit.author).toBe(TEST_BITBUCKET_AUTHOR);
});

/* TODO: Capture code pipeline event from git hub.
test("action-commit-github", async () => {
  const gitHub = new GitHub(TEST_GITHUB_USERNAME, TEST_GITHUB_TOKEN);

  const pipelog = new PipeLog(DB_TABLE, gitHub);
  await pipelog.handleEvent(checkoutFromBitbucketEvent());

  expect(pipelog.commit.author).toBe(TEST_GITHUB_AUTHOR);
});
 */

const checkoutFromBitbucketEvent = () => ({
  detail: {
    pipeline: "My Awesome Pipeline",
    "execution-id": "2000d763-23f1-4903-85d5-4f5a71aafe35",
    stage: "Source",
    state: "SUCCEEDED",
    type: {
      provider: "CodeStarSourceConnection",
    },
    "execution-result": {
      "external-execution-url": `https://blahblah/foo/bar?Commit=${TEST_BITBUCKET_COMMIT}&FullRepositoryId=${TEST_BITBUCKET_REPO}`,
    },
  },
});
