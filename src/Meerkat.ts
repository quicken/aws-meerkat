import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodePipelineEvent } from "./types/AwsCodePipeline";
import { Notification, RawMessage } from "./types/common";
import { Chat } from "./chat/Chat";
import { Bot } from "./bot/Bot";
import { SimpleBot } from "./bot/SimpleBot";
import { CloudWatchAlertBot } from "./bot/CloudwatchAlertBot";
import { CodePipelineBot } from "./bot/CodePipelineBot";
import { DiscordChat } from "./chat/DiscordChat";
import { SlackChat } from "./chat/SlackChat";
import { PipeLog } from "./lib/PipeLog";
import { CodeBuild } from "./lib/CodeBuild";
import { CodeDeploy } from "./lib/CodeDeploy";
import { BitBucket } from "./lib/BitBucket";
import { GitHub } from "./lib/GitHub";
import { SNSEvent } from "aws-lambda";

const DB_TABLE = process.env.DB_TABLE || "devops-pipeline-monitor";

/**
 * Meerkat contains the business logic for processing incoming messages from an SNS Topic subscription.
 *
 * Meerkat will attempt to parse the incoming message and determine the BOT that should
 * perform message processing.
 *
 * If a bot generates a notification, meerkat will hand the notification to a chat service for delivery.
 *
 */
export class Meerkat {
  /**
   * The Dynamo DB Client that will be used to track notification meta data.
   */
  dynamoDb: DynamoDBClient;

  /** The service that will be used to retrieve commit information when
   * processing AWS Code Pipeline events.  */
  codeprovider: BitBucket | GitHub;

  /** Identifies the chat service that should be used to deliver notification.
   * If a service can not be mapped discord will be used. */
  chatService: string;

  constructor(
    dynamoDb: DynamoDBClient,
    codeprovider: BitBucket | GitHub,
    chatService: string
  ) {
    this.dynamoDb = dynamoDb;
    this.codeprovider = codeprovider;
    this.chatService = chatService;
  }

  /**
   * This is the entry point used by a lambda function that want to process
   * incoming SNS Events using Meerkat.
   * @param snsEvent The SNSEvent received by an AWS Lambda function that is subscribed to an SNS Topic.
   * @returns
   */
  main = async (snsEvent: SNSEvent) => {
    try {
      const rawMessage = this.parseSnsEvent(snsEvent);
      return await this.handleMessage(rawMessage);
    } catch (error) {
      console.log("Meerkat main error:", error);
      throw error;
    }
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
      rawMessage.subject = event.Records[0].Sns.Subject ?? "";
      rawMessage.body = JSON.parse(event.Records[0].Sns.Message);
    } catch (err: any) {
      rawMessage.isJson = false;
      rawMessage.subject = event.Records[0].Sns.Subject ?? "";
      rawMessage.body = event.Records[0].Sns.Message;
    }

    return rawMessage;
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
  handleMessage = async (
    rawMessage: RawMessage
  ): Promise<Notification | null> => {
    const bot = await this.botFactory(rawMessage);
    const notification = await bot.handleMessage(rawMessage);
    if (notification) {
      const chat = this.chatFactory(this.chatService);
      await chat.sendNotification(notification);
      await bot.notificationSent();
      return notification;
    }
    return null;
  };

  /**
   * Returns an instance of the Bot that should handle this rawMessage.
   *
   * @param rawMessage A rawMessage that should be mapped to a specific "bot".
   * @returns
   */
  botFactory = async (rawMessage: RawMessage): Promise<Bot> => {
    if (rawMessage.isJson) {
      const body = rawMessage.body as Record<string, unknown>;

      if (body.AlarmDescription && body.AlarmArn && body.NewStateReason) {
        return new CloudWatchAlertBot();
      }

      if (
        body.detailType &&
        body.detailType + "" === body.detailType &&
        body.detailType.startsWith("CodePipeline")
      ) {
        return await this.createCodePipelineBot(rawMessage);
      }
    }

    return new SimpleBot();
  };

  /**
   * Converts rawMessage into pipeline notification. If the raw message has already been processed or is a code pipeline event that
   * is of not interest to the pipeline handler return null.
   * @param rawMessage
   * @returns
   */
  createCodePipelineBot = async (rawMessage: RawMessage) => {
    const codePipelineEvent = rawMessage.body as CodePipelineEvent;

    const pipelog = new PipeLog(DB_TABLE, this.codeprovider, this.dynamoDb);
    const deployArn = CodePipelineBot.getDeployArnFromEnv(
      codePipelineEvent.detail.pipeline,
      process.env
    );
    const codeDeployConfig = await CodeDeploy.createClientConfig(deployArn);

    const codeDeploy = new CodeDeploy(new CodeDeployClient(codeDeployConfig));
    const codeBuild = new CodeBuild(new CodeBuildClient({}));
    const pipebot = new CodePipelineBot(pipelog, codeBuild, codeDeploy);

    return pipebot;
  };

  /**
   * Returns the chat service that should be used to send notifications.
   * @param service The service identifier. e.g. slack, discord etc.
   * @returns
   */
  chatFactory = (service: string): Chat => {
    switch (service) {
      case "slack":
        return new SlackChat();
      case "discord":
      default:
    }
    return new DiscordChat();
  };
}
