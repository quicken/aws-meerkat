import {
  CodeDeployClient,
  BatchGetDeploymentTargetsCommand,
  ListDeploymentTargetsCommand,
} from "@aws-sdk/client-codedeploy";
import { mockClient } from "aws-sdk-client-mock";

import { CodeDeploy } from "../../src/lib/CodeDeploy";
import { AWS_LIST_TARGETS, AWS_BATCH_TARGETS } from "../sample/aws/codeDeploy";

/**
 * More info on mocking AWS SDK Calls:
 * https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
 */
const codeDeployMock = mockClient(CodeDeployClient) as any;

beforeEach(() => {
  jest.clearAllMocks();
  codeDeployMock.reset();
});

test("fetch-deployment", async () => {
  codeDeployMock.on(ListDeploymentTargetsCommand).resolves(AWS_LIST_TARGETS);
  codeDeployMock
    .on(BatchGetDeploymentTargetsCommand)
    .resolves(AWS_BATCH_TARGETS);

  const codeDeploy = new CodeDeploy(codeDeployMock);
  const detail = await codeDeploy.deployDetails("dummy-deployment-id");

  expect(detail.length).toBe(2);
  expect(detail[0]?.instanceid).toBe("i-03ffb163f3a80ec87");
});
