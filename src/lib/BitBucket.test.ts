import "dotenv/config";
import { BitBucket } from "./BitBucket";

const BITBUCKET = {
  username: process.env.BITBUCKET_USERNAME || "",
  password: process.env.BITBUCKET_PASSWORD || "",
  repo: process.env.TEST_BITBUCKET_REPO || "",
  commitid: process.env.TEST_BITBUCKET_COMMIT || "",
  author: process.env.TEST_BITBUCKET_AUTHOR || "",
};

test("fetch-commit", async () => {
  const bitbucket = new BitBucket(
    BITBUCKET.repo,
    BITBUCKET.username,
    BITBUCKET.password
  );

  const commit = await bitbucket.fetchCommit(BITBUCKET.commitid);
  expect(commit.author).toBe(BITBUCKET.author);
});
