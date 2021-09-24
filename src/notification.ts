import { SNSEvent, SNSHandler, Context } from "aws-lambda";
import { Discord } from "./lib/Discord";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const DISCORD_AVATAR = process.env.DISCORD_AVATAR || "";

export const simpleMessageHandler: SNSHandler = async (
  event: SNSEvent,
  context?: Context
) => {
  let snsSubject;
  let snsMessage;
  try {
    snsSubject = event.Records[0].Sns.Subject;
    snsMessage = event.Records[0].Sns.Message;
  } catch (err: any) {
    console.log(err.stack);
    return;
  }

  const discord = new Discord();
  const discordMessage = discord.simpleMessage(snsSubject, snsMessage);

  await discord.postMessage(discordMessage, DISCORD_WEBHOOK, DISCORD_AVATAR);

  console.log("Sent message to discord");
};
