import { SNSEvent, SNSHandler, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PipeLog } from "./lib/PipeLog";
import { Service } from "./lib/Service";
import { Discord } from "./lib/Discord";

const REGION = process.env.REGION || "";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const DISCORD_AVATAR = process.env.DISCORD_AVATAR || "";
const BITBUCKET = {
  username: process.env.BITBUCKET_USERNAME || "",
  password: process.env.BITBUCKET_PASSWORD || "",
};

export const handler: SNSHandler = async (
  event: SNSEvent,
  context?: Context
) => {
  let pipeEvent;
  try {
    /* https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html */
    pipeEvent = JSON.parse(event.Records[0].Sns.Message);
  } catch (err: any) {
    console.log(err.stack);
    return;
  }

  const executionId = pipeEvent.detail["execution-id"];

  const dynamo = new DynamoDBClient({ region: REGION });
  const pipelog = new PipeLog(BITBUCKET.username, BITBUCKET.password);

  await pipelog.load(executionId, dynamo);
  await pipelog.handleEvent(pipeEvent);

  let failure = await Service.getFirstFailure(pipelog);
  if (failure && !pipelog.isNotified) {
    console.log("Sending Message");

    const discord = new Discord();

    const discordMessage = discord.createPipeFailureMessage(
      pipelog.name,
      pipelog.commit,
      failure
    );

    await discord.postMessage(discordMessage, DISCORD_WEBHOOK, DISCORD_AVATAR);

    pipelog.isNotified = true;
  }

  await pipelog.save(dynamo);

  console.log("Processed SNS Message");
};
