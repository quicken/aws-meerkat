import "dotenv/config";
import { Util } from "../../src/lib/Util";
import { STSClient } from "@aws-sdk/client-sts";
import {
  CodeDeployClient,
  BatchGetDeploymentTargetsCommand,
  ListDeploymentTargetsCommand,
} from "@aws-sdk/client-codedeploy";
import { CodeDeploy } from "../../src/lib/CodeDeploy";
import {
  AWS_LIST_TARGETS,
  AWS_BATCH_TARGETS,
} from "../lib/pipeline/SampleBatchGetDeploymentTargets";
import { mockClient } from "aws-sdk-client-mock";

/**
 * More info on mocking AWS SDK Calls:
 * https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
 */

const codeDeployMock = mockClient(CodeDeployClient) as any;

const REGION = process.env.REGION || "";
const DEPLOY_ARN = process.env.DEPLOY_ARN || "";
const TEST_CODE_DEPLOY_ID = process.env.TEST_CODE_DEPLOY_ID || "";

beforeEach(() => {
  jest.clearAllMocks();
  codeDeployMock.reset();
});

test("test-disabled", async () => {
  codeDeployMock.on(ListDeploymentTargetsCommand).resolves(AWS_LIST_TARGETS);
  codeDeployMock
    .on(BatchGetDeploymentTargetsCommand)
    .resolves(AWS_BATCH_TARGETS);

  const codeDeploy = new CodeDeploy(codeDeployMock);
  const foo = await codeDeploy.deployDetails("dummy-deployment-id");
  console.log(foo);
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
