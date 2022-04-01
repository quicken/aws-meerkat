import {
  CodeBuildClient,
  BatchGetBuildsCommand,
} from "@aws-sdk/client-codebuild";
import { mockClient } from "aws-sdk-client-mock";

import { CodeBuild } from "../../src/lib/CodeBuild";
import { SAMPLE_BATCH_BUILDS } from "../sample/aws/codeBuild";

const codeBuildMock = mockClient(CodeBuildClient) as any;

beforeEach(() => {
  jest.clearAllMocks();
  codeBuildMock.reset();
});

test("fetch-build", async () => {
  codeBuildMock.on(BatchGetBuildsCommand).resolves(SAMPLE_BATCH_BUILDS);

  const codeBuild = new CodeBuild(codeBuildMock);
  const buildLogUrl = await codeBuild.fetchBuildLogUrl("mock");
  expect(buildLogUrl).toBe(
    "https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#logEvent:group=/aws/codebuild/meerkat;stream=56be3e40-853a-1111-2222-f88ce291fdad"
  );
});
