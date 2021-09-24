import "dotenv/config";
import { BitBucket } from "./BitBucket";

const BITBUCKET = {
  username: process.env.GIT_USERNAME || "",
  password: process.env.GIT_PASSWORD || "",
  repo: process.env.TEST_BITBUCKET_REPO || "",
  commitid: process.env.TEST_BITBUCKET_COMMIT || "",
  author: process.env.TEST_BITBUCKET_AUTHOR || "",
};

test("fetch-commit", async () => {
  const bitbucket = new BitBucket(BITBUCKET.username, BITBUCKET.password);

  const commit = await bitbucket.fetchCommit(
    BITBUCKET.repo,
    BITBUCKET.commitid
  );
  expect(commit.author).toBe(BITBUCKET.author);
});
