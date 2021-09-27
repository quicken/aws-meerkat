import { SNSEvent, SNSHandler, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PipeLog } from "./lib/PipeLog";
import { Service } from "./lib/Service";
import { Discord } from "./lib/Discord";
import { BitBucket } from "./lib/BitBucket";
import { GitHub } from "./lib/GitHub";
import { Util } from "./lib/Util";

const REGION = process.env.REGION || "";
const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const DISCORD_AVATAR = process.env.DISCORD_AVATAR || "";
const DISCORD_USERNAME = process.env.DISCORD_USERNAME || "AWS Notification";
const GIT_PROVIDER = process.env.GIT_PROVIDER || "";
const GIT_USERNAME = process.env.GIT_USERNAME || "";
const GIT_PASSWORD = process.env.GIT_PASSWORD || "";

export const handler: SNSHandler = async (
  event: SNSEvent,
  context?: Context
) => {
  console.log("v1.1.0");
  console.log(handler);

  const discord = new Discord();

  let pipeEvent;
  try {
    /*
    Received messages from SNS are in "Processed event" format see this link:
    https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html */
    pipeEvent = JSON.parse(event.Records[0].Sns.Message);
  } catch (err: any) {
    const simpleMessage = discord.simpleMessage(
      event.Records[0].Sns.Subject,
      event.Records[0].Sns.Message
    );
    await discord.postMessage(
      simpleMessage,
      DISCORD_WEBHOOK,
      DISCORD_AVATAR,
      DISCORD_USERNAME
    );
    return;
  }

  if (
    !pipeEvent.hasOwnProperty("detailType") ||
    !pipeEvent.detailType.startsWith("CodePipeline")
  ) {
    /* Handle Cloudwatch Alarms. */
    if (Util.isAlarmMessage(pipeEvent)) {
      const alarm = Util.castToAlarm(pipeEvent);
      const alarmMessage = discord.alarmMessage(alarm);
      const alarmColor = ["alarm", "nag"].includes(alarm.type)
        ? 10038562
        : 3066993; /* Red or Green */
      await discord.postMessage(
        alarmMessage,
        DISCORD_WEBHOOK,
        DISCORD_AVATAR,
        DISCORD_USERNAME,
        alarmColor
      );
    }
    return;
  }

  let codeProvider;
  if (GIT_PROVIDER.toLowerCase() === "bitbucket") {
    codeProvider = new BitBucket(GIT_USERNAME, GIT_PASSWORD);
  } else {
    codeProvider = new GitHub(GIT_USERNAME, GIT_PASSWORD);
  }

  const executionId = pipeEvent.detail["execution-id"];

  const dynamo = new DynamoDBClient({ region: REGION });
  const pipelog = new PipeLog(DB_TABLE, codeProvider);

  await pipelog.load(executionId, dynamo);

  await pipelog.handlePipelineAction(pipeEvent);

  if (!pipelog.name) pipelog.name = pipeEvent.detail.pipeline;

  if (pipeEvent.detailType === "CodePipeline Pipeline Execution State Change") {
    const failure = await Service.getFirstFailure(pipelog);

    if (failure && !pipelog.isNotified) {
      console.log("Sending Message");

      const failedMessage = discord.createPipeFailureMessage(
        pipelog.name,
        pipelog.commit,
        failure
      );

      const DARK_RED = 10038562;
      await discord.postMessage(
        failedMessage,
        DISCORD_WEBHOOK,
        DISCORD_AVATAR,
        DISCORD_USERNAME,
        DARK_RED
      );

      pipelog.isNotified = true;
    } else if (pipeEvent.detail.state === "SUCCEEDED" && !pipelog.isNotified) {
      const successMessage = discord.createPipeSuccessMessage(
        pipelog.name,
        pipelog.commit
      );

      const GREEN = 3066993;
      await discord.postMessage(
        successMessage,
        DISCORD_WEBHOOK,
        DISCORD_AVATAR,
        DISCORD_USERNAME,
        GREEN
      );

      pipelog.isNotified = true;
    }
  }
  await pipelog.save(dynamo);

  console.log("Processed SNS Message");
};
