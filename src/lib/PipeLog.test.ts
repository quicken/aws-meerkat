import "dotenv/config";
import { PipeLog } from "./PipeLog";

const BITBUCKET = {
  username: process.env.BITBUCKET_USERNAME || "",
  password: process.env.BITBUCKET_PASSWORD || "",
  repo: process.env.TEST_BITBUCKET_REPO || "",
  commitid: process.env.TEST_BITBUCKET_COMMIT || "",
  author: process.env.TEST_BITBUCKET_AUTHOR || "",
};

test("action-commit-bitbucket", async () => {
  const pipelog = new PipeLog(BITBUCKET.username, BITBUCKET.password);
  await pipelog.handleEvent(checkoutFromBitbucketEvent());

  expect(pipelog.commit.author).toBe(BITBUCKET.author);
});

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
      "external-execution-url": `https://blahblah/foo/bar?Commit=${BITBUCKET.commitid}&FullRepositoryId=${BITBUCKET.repo}`,
    },
  },
});
