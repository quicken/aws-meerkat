import "dotenv/config";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodeBuild } from "./CodeBuild";

const REGION = process.env.REGION || "";
const TEST_CODE_BUILD_ID = process.env.TEST_CODE_BUILD_ID || "";

test("fetch-build", async () => {
  const cbClient = new CodeBuildClient({
    region: REGION,
  });

  const data = await CodeBuild.fetchBuildLogUrl(TEST_CODE_BUILD_ID, cbClient);
  console.log(data);
  expect(1).toBe(1);
});
