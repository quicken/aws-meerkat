import "dotenv/config";
import { Util } from "../../src/lib/Util";
import { BITBUCKET_GET_COMMIT_RESPONSE } from "./TestSamples";
import { BitBucket } from "../../src/lib/BitBucket";

jest.mock("../../src/lib/Util");

const BITBUCKET = {
  email: "",
  token: "",
  repo: "",
  commitid: "",
  author: "",
};

test("fetch-commit", async () => {
  /* Mock calling the bitbucket API. */
  jest.mocked(Util.callEndpoint).mockResolvedValue(
    { statuscode: 200, body: BITBUCKET_GET_COMMIT_RESPONSE }
  );

  const bitbucket = new BitBucket(BITBUCKET.email, BITBUCKET.token);
  const commit = await bitbucket.fetchCommit(
    BITBUCKET.repo,
    BITBUCKET.commitid
  );

  expect(commit.author).toBe("Marcel Scherzet <mscherzer@gmail.com>");
});
