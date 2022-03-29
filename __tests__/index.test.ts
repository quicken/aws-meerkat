import "dotenv/config";
import { SNSEvent, Context } from "aws-lambda";
import { handler as lambdaHandler } from "../src/index";
import {
  PIPELINE_SUCCESS_EVENT,
  SNS_ALARM_MESSAGE,
  PIPELINE_SOURCE_ACTION_GITHUB,
} from "./lib/TestSamples";

const RUN_INTEGRATION_TESTS = false;
beforeAll(() => {
  if (!RUN_INTEGRATION_TESTS) {
    console.info(
      "\x1b[33m%s\x1b[0m",
      "INTEGRATION_TESTS are disabled. Skipping all integration tests."
    );
  }
  return;
});

test("run-lambda", async () => {
  if (!RUN_INTEGRATION_TESTS) return;

  const fakeEvent = {
    detail: {
      pipeline: "My Awesome Pipeline",
      "execution-id": "2000d763-23f1-4903-85d5-4f5a71aafe35",
      stage: "Source",
      state: "SUCCEEDED",
      type: {
        provider: "CodeStarSourceConnection",
      },
      "execution-result": {
        "external-execution-url": `https://github.com/quicken/aws-meerkat/commit/2d33f3db9215f9368cbe4f71049a4c511236b4e3`,
      },
    },
  };

  await runLambdaWithSNS("Testing", fakeEvent);
  /*
  await runLambdaWithSNS(
    "Testing",
    JSON.parse(FAILED_DEPLOYMENT_EVENT.Records[0].Sns.Message)
  );
  */
  expect(1).toBe(1);
});

test("pipeline-source-action", async () => {
  if (!RUN_INTEGRATION_TESTS) return;

  await runLambdaWithSNS("Testing", PIPELINE_SOURCE_ACTION_GITHUB);
  expect(1).toBe(1);
});

test("pipeline-success-event", async () => {
  if (!RUN_INTEGRATION_TESTS) return;
  // await runLambdaWithSNS("Testing", PIPELINE_SUCCESS_EVENT);
  expect(1).toBe(1);
});

test("alarm-failed-event", async () => {
  if (!RUN_INTEGRATION_TESTS) return;
  // await runLambdaWithSNS("Testing", SNS_ALARM_MESSAGE);
  expect(1).toBe(1);
});

async function runLambdaWithSNS(subject: string, message: object) {
  const event = createSNSEvent(subject, JSON.stringify(message));
  const context = createContext();

  await lambdaHandler(event, context, () => {});
}

function createSNSEvent(subject: string, message: string): SNSEvent {
  return {
    Records: [
      {
        EventSource: "aws:sns",
        EventVersion: "1.0",
        EventSubscriptionArn:
          "arn:aws:sns:us-east-1:{{{accountId}}}:ExampleTopic",
        Sns: {
          Type: "Notification",
          MessageId: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
          TopicArn: "arn:aws:sns:us-east-1:123456789012:ExampleTopic",
          Subject: subject,
          Message: message,
          Timestamp: "1970-01-01T00:00:00.000Z",
          SignatureVersion: "1",
          Signature: "EXAMPLE",
          SigningCertUrl: "EXAMPLE",
          UnsubscribeUrl: "EXAMPLE",
          MessageAttributes: {
            Test: {
              Type: "String",
              Value: "TestString",
            },
            TestBinary: {
              Type: "Binary",
              Value: "TestBinary",
            },
          },
        },
      },
    ],
  };
}

function createContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: true,
    functionName: "blah",
    functionVersion: "string",
    invokedFunctionArn: "string",
    memoryLimitInMB: "string",
    awsRequestId: "string",
    logGroupName: "string",
    logStreamName: "string",
    getRemainingTimeInMillis: () => 10,
    done: (error?: Error, result?: any) => {},
    fail: (error: Error | string) => {},
    succeed: (messageOrObject) => {},
  };
}
