import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { Meerkat } from "../src/Meerkat";
import { Commit } from "../src/types/common";
import { BitBucket } from "../src/lib/BitBucket";
import { ITEM_SUCCESSFULL_PIPE_LOG } from "./sample/aws/dynamoDb";

import { PIPELINE_STAGE_BUILD_ACTION_BUILD_STARTED } from "./sample/pipeline/SuccessFlowEvents";

const CHAT_SERVICE = "discord";

const dynamoDbMock = mockClient(DynamoDBClient) as any;
const bitbucket = new BitBucket("", "");

jest.mock("../src/lib/BitBucket", () => {
  return {
    BitBucket: jest.fn().mockImplementation(() => {
      return {
        fetchCommit: (repo: string, commitId: string): Promise<Commit> => {
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

beforeEach(() => {
  dynamoDbMock.reset();
});

test("debug", async () => {
  dynamoDbMock.on(GetItemCommand).resolves(ITEM_SUCCESSFULL_PIPE_LOG);
  const meerkat = new Meerkat(dynamoDbMock, bitbucket, CHAT_SERVICE);
  const rawMessage = {
    isJson: true,
    subject: "",
    body: PIPELINE_STAGE_BUILD_ACTION_BUILD_STARTED,
  };

  await meerkat.handleMessage(rawMessage);

  expect(1).toBe(1);
});
