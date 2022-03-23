import "dotenv/config";
import { PipeLog } from "./PipeLog";
import { BitBucket } from "./BitBucket";
import { GitHub } from "./GitHub";
import { CommitType } from "../types";
import {
  PIPELINE_SOURCE_ACTION_BITBUCKET,
  PIPELINE_SOURCE_ACTION_GITHUB,
} from "./TestSamples";

jest.mock("./BitBucket", () => {
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

jest.mock("./GitHub", () => {
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

test("action-commit-bitbucket", async () => {
  const bitBucket = new BitBucket("", "");
  const pipelog = new PipeLog(DB_TABLE, bitBucket);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_BITBUCKET);

  expect(pipelog.commit.author).toBe("Marcel Scherzet <mscherzer@gmail.com>");
});

test("action-commit-github", async () => {
  const gitHub = new GitHub("", "");
  const pipelog = new PipeLog(DB_TABLE, gitHub);
  await pipelog.handlePipelineAction(PIPELINE_SOURCE_ACTION_GITHUB);

  expect(pipelog.commit.author).toBe("marcel <mscherzer@gmail.com>");
});
