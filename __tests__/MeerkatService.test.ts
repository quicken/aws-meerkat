import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { Meerkat } from "../src/Meerkat";
import {
  Commit,
  SimpleNotification,
  AlarmNotification,
  PipelineNotification,
} from "../src/types/common";
import { BitBucket } from "../src/lib/BitBucket";
import {
  ITEM_FAILED_DEPLOYMENT_PIPE_LOG,
  ITEM_SUCCESSFULL_PIPE_LOG,
} from "./sample/aws/dynamoDb";
import { CLOUDWATCH_ALARM } from "./sample/aws/cloudwatch";
import { PIPELINE_EXECUTION_SUCCEEDED } from "./sample/pipeline/SuccessFlowEvents";

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

test("handle_simple_message", async () => {
  dynamoDbMock.on(GetItemCommand).resolves(ITEM_FAILED_DEPLOYMENT_PIPE_LOG);
  const meerkat = new Meerkat(dynamoDbMock, bitbucket, CHAT_SERVICE);
  const rawMessage = {
    isJson: false,
    subject: "This is a test.",
    body: "Hello World",
  };

  const notification = await meerkat.handleMessage(rawMessage);

  expect(notification?.type).toBe("SimpleNotification");
  if (notification && notification.type === "SimpleNotification") {
    const simpleNotification = notification as SimpleNotification;
    expect(simpleNotification?.subject).toBe("This is a test.");
    expect(simpleNotification?.message).toBe("Hello World");
  }
});

test("handle_cloudwatch_alarm_message", async () => {
  dynamoDbMock.on(GetItemCommand).resolves(ITEM_FAILED_DEPLOYMENT_PIPE_LOG);
  const meerkat = new Meerkat(dynamoDbMock, bitbucket, CHAT_SERVICE);
  const rawMessage = {
    isJson: true,
    subject: "",
    body: CLOUDWATCH_ALARM,
  };

  const notification = await meerkat.handleMessage(rawMessage);
  expect(notification?.type).toBe("AlarmNotification");

  if (notification && notification.type === "SimpleNotification") {
    const alarmNotification = notification as AlarmNotification;
    expect(alarmNotification?.alert?.name).toBe("my-system-lb");
    expect(alarmNotification?.alert?.description).toBe("This is my Alarm");
    expect(alarmNotification?.alert?.reason).toBe(
      "Threshold Crossed: 2 out of the last 2 datapoints [5.535714886726143 (27/09/21 01:36:00), 1.7514244573552422 (27/09/21 01:35:00)] were greater than the threshold (1.0) (minimum 2 datapoints for OK -> ALARM transition)."
    );
    expect(alarmNotification?.alert?.date).toBe(1632706699630);
    expect(alarmNotification?.alert?.type).toBe("alarm");
  }
});

test("handle_code_pipeline_message_success", async () => {
  dynamoDbMock.on(GetItemCommand).resolves(ITEM_SUCCESSFULL_PIPE_LOG);
  const meerkat = new Meerkat(dynamoDbMock, bitbucket, CHAT_SERVICE);
  const rawMessage = {
    isJson: true,
    subject: "",
    body: PIPELINE_EXECUTION_SUCCEEDED,
  };

  const notification = await meerkat.handleMessage(rawMessage);

  expect(notification?.type).toBe("PipelineNotification");
  if (notification && notification.type === "PipelineNotification") {
    const pipelineNotification = notification as PipelineNotification;
    expect(1).toBe(1);
  }
});
