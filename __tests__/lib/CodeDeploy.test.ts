import "dotenv/config";
import { Util } from "../../src/lib/Util";
import { STSClient } from "@aws-sdk/client-sts";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodeDeploy } from "../../src/lib/CodeDeploy";

const REGION = process.env.REGION || "";
const DEPLOY_ARN = process.env.DEPLOY_ARN || "";
const TEST_CODE_DEPLOY_ID = process.env.TEST_CODE_DEPLOY_ID || "";

test("test-disabled", () => {
  expect(1).toBe(1);
});

/*
test("fetch-deployment", async () => {
  const stsClient = new STSClient({ region: REGION });
  const credentials = await Util.fetchCredentials(stsClient, DEPLOY_ARN);

  const cdClient = new CodeDeployClient({
    region: REGION,
    credentials: credentials,
  });

  const data = await CodeDeploy.deployDetails(TEST_CODE_DEPLOY_ID, cdClient);
  console.log(data);
  expect(1).toBe(1);
});
*/