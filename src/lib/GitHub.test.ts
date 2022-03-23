import "dotenv/config";
import { Util, SimpleHttpResponse } from "./Util";
import { GITHUB_GET_COMMIT_RESPONSE } from "./TestSamples";
import { GitHub } from "./GitHub";

jest.mock("./Util");

const GITHUB = {
  username: "",
  token: "",
  repo: "",
  commitid: "",
  author: "",
};

test("fetch-commit", async () => {
  /* Mock calling the github API. */
  Util.callEndpoint = jest.fn().mockReturnValue(
    new Promise<SimpleHttpResponse<any>>((resolve, reject) => {
      resolve({ statuscode: 200, body: GITHUB_GET_COMMIT_RESPONSE });
    })
  );

  const github = new GitHub(GITHUB.username, GITHUB.token);

  const commit = await github.fetchCommit(GITHUB.repo, GITHUB.commitid);
  expect(commit.author).toBe("marcel <mscherzer@gmail.com>");
});
