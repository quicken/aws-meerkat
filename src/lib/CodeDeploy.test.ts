import "dotenv/config";
import { Util } from "./Util";
import { STSClient } from "@aws-sdk/client-sts";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodeDeploy } from "./CodeDeploy";

const CODE_DEPLOY_ARN = process.env.CODE_DEPLOY_ARN || "";
const TEST_CODE_DEPLOY_ID = process.env.TEST_CODE_DEPLOY_ID || "";

test("fetch-deployment", async () => {
  const stsClient = new STSClient({ region: "ap-southeast-2" });
  const credentials = await Util.fetchCredentials(stsClient, CODE_DEPLOY_ARN);

  const cdClient = new CodeDeployClient({
    region: "ap-southeast-2",
    credentials: credentials,
  });

  const data = await CodeDeploy.deployDetails(TEST_CODE_DEPLOY_ID, cdClient);
  console.log(data);
  expect(1).toBe(1);
});
