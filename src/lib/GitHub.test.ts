import "dotenv/config";
import { GitHub } from "./GitHub";

const GITHUB = {
  username: process.env.GITHUB_USERNAME || "",
  token: process.env.GITHUB_TOKEN || "",
  repo: process.env.TEST_GITHUB_REPO || "",
  commitid: process.env.TEST_GITHUB_COMMIT || "",
  author: process.env.TEST_GITHUB_AUTHOR || "",
};

test("fetch-commit", async () => {
  const github = new GitHub(GITHUB.username, GITHUB.token);

  const commit = await github.fetchCommit(GITHUB.repo, GITHUB.commitid);
  expect(commit.author).toBe(GITHUB.author);
});
