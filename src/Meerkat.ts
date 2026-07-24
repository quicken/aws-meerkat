import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodePipelineClient } from "@aws-sdk/client-codepipeline";
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
import { CodePipeline } from "./lib/CodePipeline";
import { BitBucket } from "./lib/BitBucket";
import { GitHub } from "./lib/GitHub";
import { loadConfig, MeerkatConfigData, resolveDeployArn } from "./lib/MeerkatConfig";
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

  /** Identifies the chat service that should be used to deliver notification.
   * If a service can not be mapped discord will be used. */
  chatService: string;

  /** The AWS account ID where this Lambda runs. Used to skip cross-account
   *  role assumption for events from the same account. Set from Lambda context. */
  lambdaAccount: string = "";

  private config: MeerkatConfigData | null = null;
  private codeprovider!: BitBucket | GitHub;

  constructor(
    dynamoDb: DynamoDBClient,
    chatService: string,
  ) {
    this.dynamoDb = dynamoDb;
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
      await this.ensureInitialized();
      const rawMessage = this.parseSnsEvent(snsEvent);
      return await this.handleMessage(rawMessage);
    } catch (error) {
      console.log("Meerkat main error:", error);
      throw error;
    }
  };

  private async ensureInitialized(): Promise<void> {
    if (!this.config) {
      this.config = await loadConfig();
      this.codeprovider = this.createCodeProvider(this.config);
    }
  }

  private createCodeProvider(config: MeerkatConfigData): BitBucket | GitHub {
    const provider = (process.env.GIT_PROVIDER || "").toLowerCase();
    if (provider === "bitbucket") {
      if (!config.bitbucket) {
        throw new Error("Bitbucket config (email, token) is required in MEERKAT_CONFIG_PARAM");
      }
      return new BitBucket(config.bitbucket.email, config.bitbucket.token);
    }
    if (!config.github) {
      throw new Error("GitHub config (username, token) is required in MEERKAT_CONFIG_PARAM");
    }
    return new GitHub(config.github.username, config.github.token);
  }

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
      subject: event.Records[0].Sns.Subject ?? "",
      body: event.Records[0].Sns.Message,
    };

    try {
      rawMessage.body = JSON.parse(event.Records[0].Sns.Message);
      rawMessage.isJson = true;
    } catch (err: unknown) {
      console.log(
        "parseSnsEvent: message is not JSON, treating as plain text",
        err,
      );
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
    rawMessage: RawMessage,
  ): Promise<Notification | null> => {
    await this.ensureInitialized();
    const bot = await this.botFactory(rawMessage);
    const notification = await bot.handleMessage(rawMessage);
    if (notification) {
      const chat = await this.chatFactory(this.chatService);
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
        typeof body.detailType === "string" &&
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

    const versionPattern = this.config?.artifactSource?.versionPattern;
    const deployArn = resolveDeployArn(
      codePipelineEvent.account,
      codePipelineEvent.detail.pipeline,
      this.config,
      process.env,
      this.lambdaAccount,
    );

    // Use the event's region so API calls target the correct region (e.g. us-east-2 for Jamaica)
    const eventRegion = codePipelineEvent.region || undefined;

    // Create CodePipeline client for fetching S3 source keys (uses same cross-account role as CodeDeploy)
    let codePipeline: CodePipeline | null = null;
    let codeDeployConfig = {};
    let codeBuildConfig = {};
    try {
      if (deployArn) {
        const codePipelineConfig = await CodePipeline.createClientConfig(deployArn, eventRegion);
        codePipeline = new CodePipeline(new CodePipelineClient(codePipelineConfig));
        codeDeployConfig = await CodeDeploy.createClientConfig(deployArn, eventRegion);
        codeBuildConfig = await CodeBuild.createClientConfig(deployArn, eventRegion);
      } else {
        // No role assumption needed — use Lambda's own credentials
        codePipeline = new CodePipeline(new CodePipelineClient({ region: eventRegion }));
      }
    } catch (error) {
      console.error("Meerkat: Failed to assume cross-account role, proceeding without:", error);
      // Fall back to Lambda's own credentials (may not work cross-account but won't crash)
      codePipeline = new CodePipeline(new CodePipelineClient({ region: eventRegion }));
    }

    const pipelog = new PipeLog(DB_TABLE, this.codeprovider, this.dynamoDb, versionPattern, codePipeline);

    const codeDeploy = new CodeDeploy(new CodeDeployClient(codeDeployConfig));
    const codeBuild = new CodeBuild(new CodeBuildClient(codeBuildConfig));
    const pipebot = new CodePipelineBot(pipelog, codeBuild, codeDeploy);

    return pipebot;
  };

  /**
   * Returns the chat service that should be used to send notifications.
   * @param service The service identifier. e.g. slack, discord etc.
   * @returns
   */
  chatFactory = async (service: string): Promise<Chat> => {
    const accountNames = this.config?.accounts ?? {};
    switch (service) {
      case "slack":
        return new SlackChat(
          this.config?.slack?.routes ?? [],
          accountNames,
          this.config?.slack?.defaultChannel ?? "",
          this.config?.slack?.botToken ?? "",
        );
      case "discord":
      default:
    }
    return new DiscordChat(accountNames, this.config?.discord);
  };
}
