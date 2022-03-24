import "dotenv/config";
import { Util, SimpleHttpResponse } from "../../src/lib/Util";
import { BITBUCKET_GET_COMMIT_RESPONSE } from "./TestSamples";
import { BitBucket } from "../../src/lib/BitBucket";

jest.mock("../../src/lib/Util");

const BITBUCKET = {
  username: "",
  password: "",
  repo: "",
  commitid: "",
  author: "",
};

test("fetch-commit", async () => {
  /* Mock calling the bitbucket API. */
  Util.callEndpoint = jest.fn().mockReturnValue(
    new Promise<SimpleHttpResponse<any>>((resolve, reject) => {
      resolve({ statuscode: 200, body: BITBUCKET_GET_COMMIT_RESPONSE });
    })
  );

  const bitbucket = new BitBucket(BITBUCKET.username, BITBUCKET.password);
  const commit = await bitbucket.fetchCommit(
    BITBUCKET.repo,
    BITBUCKET.commitid
  );

  expect(commit.author).toBe("Marcel Scherzet <mscherzer@gmail.com>");
});
