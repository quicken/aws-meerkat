import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  ManualApprovalNotification,
  SimpleNotification,
} from "../types/common";
import { Slack, SlackMessageType } from "../lib/Slack";
import { SlackRoute, SlackRouteRule } from "../lib/SlackRoute";
import { Chat } from "./Chat";

/**
 * SlackChat is a class that extends the Chat class to handle sending notifications to Slack.
 * It formats different types of notifications and sends them to a specified Slack channel.
 */

export class SlackChat extends Chat {
  private readonly slack: Slack;
  private readonly slackRoute: SlackRoute;
  private readonly accountNames: Record<string, string>;
  private readonly defaultChannel: string;

  constructor(
    routes: SlackRouteRule[],
    accountNames: Record<string, string> = {},
    defaultChannel: string = "",
    botToken: string = "",
  ) {
    super();
    this.slack = new Slack(botToken);
    this.slackRoute = new SlackRoute(routes);
    this.accountNames = accountNames;
    this.defaultChannel = defaultChannel;
  }

  /** Formats and then sends a notification to Slack. */
  sendNotification = async (notification: Notification) => {
    const slackMessage = await this.createMessage(notification);
    if (!slackMessage) {
      console.log("SlackChat: No message to send");
      return;
    }

    const targetChannel = this.resolveChannel(notification);
    await this.slack.postMessageToChannel(slackMessage, targetChannel);
  };

  private resolveChannel(notification: Notification): string {
    try {
      const channel =
        this.slackRoute.evaluateRoute(notification) ?? this.defaultChannel;
      console.debug(
        "SlackChat: Resolved channel:",
        channel,
        "for notification type:",
        notification.type,
      );
      return channel;
    } catch (error) {
      console.error("SlackChat: Error evaluating routes:", error);
      return this.defaultChannel;
    }
  }

  private async createMessage(
    notification: Notification,
  ): Promise<SlackMessageType | null> {
    switch (notification.type) {
      case "SimpleNotification": {
        const n = notification as SimpleNotification;
        return this.slack.simpleMessage(n.subject, n.message);
      }

      case "AlarmNotification": {
        const n = notification as AlarmNotification;
        const title = this.withAccountLabel(
          `Cloudwatch Alarm: ${n.alert.name}`,
          n.account,
        );
        return this.slack.simpleMessage(title, n.alert.reason);
      }

      case "PipelineNotification":
        return this.createPipelineMessage(notification as PipelineNotification);

      case "ManualApprovalNotification": {
        const n = notification as ManualApprovalNotification;
        const slackUserId = await this.lookupSlackUserByEmail(
          n.authorEmail,
          n.author,
        );
        const title = this.withAccountLabel(`Code Pipeline: ${n.name}`, n.account);
        return this.slack.createManualApprovalMessage(
          title,
          n.approvalAttributes,
          slackUserId,
        );
      }

      default:
        return null;
    }
  }

  private async createPipelineMessage(
    notification: PipelineNotification,
  ): Promise<SlackMessageType> {
    console.log("SlackChat: Processing pipeline notification");
    const slackUserId = await this.lookupSlackUser(notification);
    const title = this.withAccountLabel(
      `Code Pipeline: ${notification.name}`,
      notification.account,
    );

    if (notification.successfull) {
      return this.slack.createPipeSuccessMessage(
        title,
        notification.commit,
        slackUserId,
      );
    }
    return this.slack.createPipeFailureMessage(
      title,
      notification.commit,
      notification.failureDetail,
      slackUserId,
      notification.sourceFailure,
    );
  }

  private async lookupSlackUser(
    notification: PipelineNotification,
  ): Promise<string | null> {
    return this.lookupSlackUserByEmail(
      notification.commit.authorEmail,
      notification.commit.author,
    );
  }

  private async lookupSlackUserByEmail(
    email?: string,
    name?: string,
  ): Promise<string | null> {
    if (!email && !name) return null;
    try {
      return await Promise.race([
        this.slack.findSlackUserId(email, name),
        new Promise<null>((resolve) =>
          setTimeout(() => {
            console.log("SlackChat: User lookup timed out");
            resolve(null);
          }, 5000),
        ),
      ]);
    } catch (error) {
      console.error("SlackChat: Error during user lookup:", error);
      return null;
    }
  }

  /** Appends account friendly name to title if mapping exists. */
  private withAccountLabel(title: string, accountId: string): string {
    const name = this.accountNames[accountId];
    return name ? `${title} [${name}]` : title;
  }
}
