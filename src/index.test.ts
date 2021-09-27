import "dotenv/config";
import { SNSEvent, Context } from "aws-lambda";
import { handler as lambdaHandler } from "./index";

const BITBUCKET = {
  username: process.env.BITBUCKET_USERNAME || "",
  password: process.env.BITBUCKET_PASSWORD || "",
  repo: process.env.TEST_BITBUCKET_REPO || "",
  commitid: process.env.TEST_BITBUCKET_COMMIT || "",
  author: process.env.TEST_BITBUCKET_AUTHOR || "",
};

test("run-lambda", async () => {
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
        "external-execution-url": `https://blahblah/foo/bar?Commit=${BITBUCKET.commitid}&FullRepositoryId=${BITBUCKET.repo}`,
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

test("pipeline-success-event", async () => {
  await runLambdaWithSNS("Testing", pipelineSuccessEvent);
  expect(1).toBe(1);
});

test("alarm-failed-event", async () => {
  await runLambdaWithSNS("Testing", snsAlarmMessage);
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

const pipelineSuccessEvent = {
  account: "111111111111",
  detailType: "CodePipeline Pipeline Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2021-09-25T07:59:53Z",
  notificationRuleArn:
    "arn:aws:codestar-notifications:ap-southeast-2:111111111111:notificationrule/b458395bbc1aa895fe86a3b3bf0aa7a71c9fffff",
  detail: {
    pipeline: "example-pipe-monitor-codepipeline",
    "execution-id": "a6bf7e98-2fd2-4977-aed8-c4abd047a8c0",
    state: "SUCCEEDED",
    version: 1.0,
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:111111111111:example-pipe-monitor-codepipeline",
  ],
  additionalAttributes: {},
};

const snsAlarmMessage = {
  AlarmName: "my-system-lb",
  AlarmDescription: "This is my Alarm",
  AWSAccountId: "111111111111",
  NewStateValue: "ALARM",
  NewStateReason:
    "Threshold Crossed: 2 out of the last 2 datapoints [5.535714886726143 (27/09/21 01:36:00), 1.7514244573552422 (27/09/21 01:35:00)] were greater than the threshold (1.0) (minimum 2 datapoints for OK -> ALARM transition).",
  StateChangeTime: "2021-09-27T01:38:19.630+0000",
  Region: "Asia Pacific (Sydney)",
  AlarmArn: "arn:aws:cloudwatch:ap-southeast-2:111111111111:alarm:lb-latency",
  OldStateValue: "OK",
  Trigger: {
    MetricName: "TargetResponseTime",
    Namespace: "AWS/ApplicationELB",
    StatisticType: "Statistic",
    Statistic: "AVERAGE",
    Unit: null,
    Dimensions: [{ value: "app/lb/12343464af00accc", name: "LoadBalancer" }],
    Period: 60,
    EvaluationPeriods: 2,
    ComparisonOperator: "GreaterThanThreshold",
    Threshold: 1.0,
    TreatMissingData: "- TreatMissingData: missing",
    EvaluateLowSampleCountPercentile: "",
  },
};
