import { SNSEvent, SNSHandler, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PipeLog } from "./lib/PipeLog";
import { Service } from "./lib/Service";
import { Discord } from "./lib/Discord";
import { BitBucket } from "./lib/BitBucket";
import { GitHub } from "./lib/GitHub";

const REGION = process.env.REGION || "";
const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const DISCORD_AVATAR = process.env.DISCORD_AVATAR || "";
const GIT_PROVIDER = process.env.GIT_PROVIDER || "";
const GIT_USERNAME = process.env.GIT_USERNAME || "";
const GIT_PASSWORD = process.env.GIT_PASSWORD || "";

export const handler: SNSHandler = async (
  event: SNSEvent,
  context?: Context
) => {
  let pipeEvent;
  try {
    /*
    Received messages from SNS are in "Processed event" format see this link:
    https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html */
    pipeEvent = JSON.parse(event.Records[0].Sns.Message);
  } catch (err: any) {
    console.log(err.stack);
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
  await pipelog.handleEvent(pipeEvent);

  if (
    pipeEvent.detail["detailType"] ===
    "CodePipeline Pipeline Execution State Change"
  ) {
    const discord = new Discord();

    const failure = await Service.getFirstFailure(pipelog);

    if (failure && !pipelog.isNotified) {
      console.log("Sending Message");

      const failedMessage = discord.createPipeFailureMessage(
        pipelog.name,
        pipelog.commit,
        failure
      );

      await discord.postMessage(failedMessage, DISCORD_WEBHOOK, DISCORD_AVATAR);

      pipelog.isNotified = true;
    } else if (pipeEvent.detail.state === "SUCCEEDED" && !pipelog.isNotified) {
      const successMessage = discord.createPipeSuccessMessage(
        pipelog.name,
        pipelog.commit
      );

      await discord.postMessage(
        successMessage,
        DISCORD_WEBHOOK,
        DISCORD_AVATAR
      );

      pipelog.isNotified = true;
    }
  }
  await pipelog.save(dynamo);

  console.log("Processed SNS Message");
};
