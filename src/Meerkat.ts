import "dotenv/config";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodePipelineEvent } from "./types/AwsCodePipeline";
import { RawMessage } from "./types/common";
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

export class Meerkat {
  dynamoDb: DynamoDBClient;
  codeprovider: BitBucket | GitHub;
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

  processSnsEvent = async (snsEvent: SNSEvent) => {
    const rawMessage = this.parseSnsEvent(snsEvent);
    return await this.handleMessage(rawMessage);
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
  handleMessage = async (rawMessage: RawMessage) => {
    const bot = await this.botFactory(rawMessage);
    const notification = await bot.handleMessage(rawMessage);
    if (notification) {
      const chat = this.chatFactory(this.chatService);
      await chat.sendNotification(notification);
      await bot.notificationSent();
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
