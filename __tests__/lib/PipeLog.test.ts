import "dotenv/config";
import { PipeLog } from "../../src/lib/PipeLog";
import { BitBucket } from "../../src/lib/BitBucket";
import { GitHub } from "../../src/lib/GitHub";
import { CommitType, LogEntryType } from "../../src/types";
import { PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED } from "./pipeline/SampleFailedBuild";
import { PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_FAILED } from "./pipeline/SampleFailedDeployment";

import {
  PIPELINE_SOURCE_ACTION_BITBUCKET,
  PIPELINE_SOURCE_ACTION_GITHUB,
} from "./pipeline/SampleSourceEvent";

jest.mock("../../src/lib/BitBucket", () => {
  return {
    BitBucket: jest.fn().mockImplementation(() => {
      return {
        fetchCommit: (repo: string, commitId: string): Promise<CommitType> => {
          return new Promise((resolve, reject) => {
            resolve({
              id: "f7ec85262da48e2b15d03037b138963c5a89d39f",
              author: "Marcel Scherzet <mscherzer@gmail.com>",
              summary:
                "DEV-666 - Custom verification link for NLE\n\nRequires a matching lambda function\n",
              link: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/commit/3fcdaa5ac3e29c79008319ede6c092643f204af0",
            });
          });
        },
      };
    }),
  };
});

jest.mock("../../src/lib/GitHub", () => {
  return {
    GitHub: jest.fn().mockImplementation(() => {
      return {
        fetchCommit: (repo: string, commitId: string): Promise<CommitType> => {
          return new Promise((resolve, reject) => {
            resolve({
              id: "f7ec85262da48e2b15d03037b138963c5a89d39f",
              author: "marcel <mscherzer@gmail.com>",
              summary:
                "The example pipeline now also creates the notification rules expected by\n" +
                "the pipeline monitor.",
              link: "https://github.com/quicken/aws-meerkat/commit/f7ec85262da48e2b15d03037b138963c5a89d39f",
            });
          });
        },
      };
    }),
  };
});

const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";

test("get_failed_gt_one", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_BITBUCKET);
  await pipelog.handlePipelineAction(PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED);
  await pipelog.handlePipelineAction(
    PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_FAILED
  );

  const FIRST_FAILED = pipelog.failed;

  if (FIRST_FAILED) {
    expect(FIRST_FAILED.id).toBe(
      "meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad"
    );
    expect(FIRST_FAILED.name).toBe("Build");
    expect(FIRST_FAILED.type).toBe("build");
    expect(FIRST_FAILED.summary).toBe(undefined);
    expect(FIRST_FAILED.link).toBe(
      "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad/view/new"
    );
  } else {
    expect(FIRST_FAILED).not.toEqual(null);
  }
});

test("get_failed_is_empty", () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket);

  expect(pipelog.failed).toBe(null);
});

test("get_is_failed_true", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  await pipelog.handlePipelineAction(PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED);
  expect(pipelog.isFailed).toBe(true);
});

test("get_is_failed_false", () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  expect(pipelog.isFailed).toBe(false);
});

test("handleCodeStarConnection_BITBUCKET_succeeded", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_BITBUCKET);

  expect(pipelog.commit.author).toBe("Marcel Scherzet <mscherzer@gmail.com>");
});

test("handleCodeStarConnection_BITBUCKET_succeeded", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_BITBUCKET);

  expect(pipelog.commit.author).toBe("Marcel Scherzet <mscherzer@gmail.com>");
});

test("handleCodeStarConnection_GITHUB_succeeded", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_GITHUB);

  expect(pipelog.commit.author).toBe("marcel <mscherzer@gmail.com>");
});

test("handleCodeBuildEvent_failed", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub);
  await pipelog.handlePipelineAction(PIPELINE_STAGE_BUILD_ACTION_BUILD_FAILED);

  const FAILED = pipelog.failed
    ? pipelog.failed
    : ({ id: "", type: "unknown", name: "" } as LogEntryType);

  expect(FAILED.id).toBe(
    "meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad"
  );
  expect(FAILED.name).toBe("Build");
  expect(FAILED.type).toBe("build");
  expect(FAILED.summary).toBe(undefined);
  expect(FAILED.link).toBe(
    "https://console.aws.amazon.com/codebuild/home?region=ap-southeast-2#/builds/meerkat-testing:56be3e40-853a-4797-9455-f88ce291fdad/view/new"
  );
});

test("handleCodeDeployActionEvent_failed", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub);
  await pipelog.handlePipelineAction(
    PIPELINE_STAGE_DEPLOY_ACTION_DEPLOY_GROUP_RED_FAILED
  );

  const FAILED = pipelog.failed
    ? pipelog.failed
    : ({ id: "", type: "unknown", name: "" } as LogEntryType);

  expect(FAILED.id).toBe("d-C3XYEM1QF");
  expect(FAILED.name).toBe("Deploy-GROUP_RED");
  expect(FAILED.type).toBe("deploy");
  expect(FAILED.summary).toBe("Deployment d-C3XYEM1QF failed");
  expect(FAILED.link).toBe(
    "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-C3XYEM1QF"
  );
});
