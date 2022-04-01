import "dotenv/config";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";

import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  SimpleNotification,
  CodePipelineEvent,
} from "./types";
import { Discord, DiscordMessageType } from "./lib/Discord";
import { PipeLog } from "./lib/PipeLog";
import { CodePipelineBot } from "./CodePipelineBot";
import { CodeBuild } from "./lib/CodeBuild";
import { CodeDeploy } from "./lib/CodeDeploy";
import { BitBucket } from "./lib/BitBucket";
import { GitHub } from "./lib/GitHub";
import { SNSEvent } from "aws-lambda";

const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const DISCORD_AVATAR = process.env.DISCORD_AVATAR || "";
const DISCORD_USERNAME = process.env.DISCORD_USERNAME || "AWS Notification";

const NOTIFICATION_SERVICE = "discord";

type RawMessage = {
  isJson: boolean;
  subject: string;
  body: string | Record<string, unknown>;
};

export class Meerkat {
  dynamoDb: DynamoDBClient;
  codeprovider: BitBucket | GitHub;

  constructor(dynamoDb: DynamoDBClient, codeprovider: BitBucket | GitHub) {
    this.dynamoDb = dynamoDb;
    this.codeprovider = codeprovider;
  }

  processSnsEvent = async (snsEvent: SNSEvent) => {
    const rawMessage = this.parseSnsEvent(snsEvent);
    const notification = await this.notificationFactory(rawMessage);
    if (notification && NOTIFICATION_SERVICE === "discord") {
      await this.sendDiscordNotification(notification);
    }
  };

  /**
   * Creates a notification from a rawMessage. If the rawMessage
   * can not be mapped to a notification then null is returned.
   *
   * If the rawMessage is of no interest to the bot then null is returned.
   *
   * No interest typically means that the message can not be associated with a
   * service, the service has already processed the message, or the service has
   * otherwise determined that no notification should be sent.
   *
   * For exmample, some code pipleine events should and are simply ignored.
   *
   *
   * @param rawMessage The raw message that should be mapped to a notification.
   * @returns A notification or null if no notification should or can be sent.
   */
  notificationFactory = async (rawMessage: RawMessage) => {
    const botname = this.botFactory(rawMessage);
    let notification: Notification | null = null;

    switch (botname) {
      case "simple":
        notification = await this.handleSimpleMessage(rawMessage);
        break;
      case "aws_cloudwatch_alarm":
        notification = await this.handleCloudWatchAlarmMessage(rawMessage);

        break;
      case "aws_codepipeline_event": {
        notification = await this.handleCodePipelineMessage(rawMessage);
        break;
      }
    }

    return notification;
  };

  /**
   * Attempt to convert a SNS Topic Subscription event received by AWS Lambda to a rawMessage.
   *
   * Received messages from SNS are in "Processed event" format see this link:
   * https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
   *
   *
   * @param event An amazon SNS event payload received by AWS Lambda.
   * @returns A raw message.
   */
  parseSnsEvent = (event: SNSEvent) => {
    const rawMessage: RawMessage = {
      isJson: false,
      subject: "",
      body: "",
    };

    try {
      rawMessage.isJson = true;
      rawMessage.subject = "";
      rawMessage.body = JSON.parse(event.Records[0].Sns.Message);
    } catch (err: any) {
      rawMessage.isJson = false;
      rawMessage.subject = event.Records[0].Sns.Subject;
      rawMessage.body = event.Records[0].Sns.Message;
    }

    return rawMessage;
  };

  /**
   * Determine which "bot" should handle mapping this rawMessage to a
   * notification.
   *
   * TODO: Convert this to a proper factory pattern. That is instead of
   * returning a string return a "bot". That implements handleSimpleMessage, handleCloudWatchAlarmMessage and handleCodePipelineMessage.
   *
   * @param rawMessage A rawMessage that should be mapped to a specific "bot".
   * @returns
   */
  botFactory = (rawMessage: RawMessage) => {
    if (!rawMessage.isJson) return "simple";

    const body = rawMessage.body as Record<string, unknown>;

    if (body.AlarmDescription && body.AlarmArn && body.NewStateReason) {
      return "aws_cloudwatch_alarm";
    }

    if (
      body.detailType &&
      body.detailType + "" === body.detailType &&
      body.detailType.startsWith("CodePipeline")
    ) {
      return "aws_codepipeline_event";
    }

    return "unknown";
  };

  /**
   * Converts rawMessage into simple message. If the raw message body is not a string return null.
   * @param rawMessage
   * @returns
   */
  handleSimpleMessage = async (rawMessage: RawMessage) => {
    if (rawMessage.body + "" !== rawMessage.body) return null;
    return {
      type: "SimpleNotification",
      subject: rawMessage.subject,
      message: rawMessage.body,
    };
  };

  /**
   * Converts rawMessage into pipeline notification. If the raw message has already been processed or is a code pipeline event that
   * is of not interest to the pipeline handler return null.
   * @param rawMessage
   * @returns
   */
  handleCodePipelineMessage = async (rawMessage: RawMessage) => {
    const codePipelineEvent = rawMessage.body as CodePipelineEvent;

    const pipelog = new PipeLog(DB_TABLE, this.codeprovider, this.dynamoDb);
    const deployArn = CodePipelineBot.getDeployArnFromEnv(
      pipelog.name,
      process.env
    );
    const codeDeployConfig = await CodeDeploy.createClientConfig(deployArn);

    const codeDeploy = new CodeDeploy(new CodeDeployClient(codeDeployConfig));
    const codeBuild = new CodeBuild(new CodeBuildClient({}));
    const pipebot = new CodePipelineBot(pipelog, codeBuild, codeDeploy);

    return pipebot.handleEvent(codePipelineEvent);
  };

  /**
   * Converts rawMessage into a cloudwatch alarm notification.
   * If the raw message body is a string returns null.
   * @param rawMessage
   * @returns
   */
  handleCloudWatchAlarmMessage = async (rawMessage: RawMessage) => {
    let type: "alarm" | "nag" | "recovered" | "healthy" = "alarm";

    if (rawMessage.body + "" === rawMessage.body) return null;
    const event = rawMessage.body as Record<string, unknown>;

    if (event.NewStateValue === event.OldStateValue) {
      if (event.NewStateValue === "OK") {
        type = "healthy";
      } else {
        type = "nag";
      }
    } else {
      if (event.NewStateValue === "OK" && event.OldStateValue === "ALARM") {
        type = "recovered";
      }
    }

    return {
      type: "AlarmNotification",
      alert: {
        type: type,
        name: event.AlarmName,
        description: event.AlarmDescription,
        reason: event.NewStateReason,
        date: new Date(event.StateChangeTime as string).getTime(),
      },
    };
  };

  /** Formats and then sends a notification to Discord. */
  sendDiscordNotification = async (notification: Notification) => {
    const GREEN = 3066993;
    const DARK_RED = 10038562;
    const discord = new Discord();

    let color;
    let discordMessage: DiscordMessageType | null = null;

    switch (notification.type) {
      case "SimpleNotification": {
        const simpleNotification = notification as SimpleNotification;
        discordMessage = discord.simpleMessage(
          simpleNotification.subject,
          simpleNotification.message
        );
        break;
      }

      case "AlarmNotification": {
        const alarmNotification = notification as AlarmNotification;

        color = ["alarm", "nag"].includes(alarmNotification.alert.type)
          ? DARK_RED
          : GREEN;
        discordMessage = discord.alarmMessage(alarmNotification);
        break;
      }

      case "PipelineNotification": {
        const pipelineNotification = notification as PipelineNotification;
        if (pipelineNotification.successfull) {
          color = GREEN;
          discordMessage = discord.createPipeSuccessMessage(
            pipelineNotification.name,
            pipelineNotification.commit
          );
        } else {
          color = DARK_RED;
          discordMessage = discord.createPipeFailureMessage(
            pipelineNotification.name,
            pipelineNotification.commit,
            pipelineNotification.failureDetail
          );
        }

        break;
      }
      default:
    }

    if (discordMessage) {
      await discord.postMessage(
        discordMessage,
        DISCORD_WEBHOOK,
        DISCORD_AVATAR,
        DISCORD_USERNAME,
        color
      );
    }
  };
}
