import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  SimpleNotification,
} from "../types/common";
import { Slack, SlackMessageType } from "../lib/Slack";
import { Chat } from "./Chat";

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || "";

export class SlackChat extends Chat {
  private slack = new Slack();

  /** Formats and then sends a notification to Discord. */
  sendNotification = async (notification: Notification) => {
    let slackMessage: SlackMessageType | null = null;

    switch (notification.type) {
      case "SimpleNotification": {
        const simpleNotification = notification as SimpleNotification;
        slackMessage = this.slack.simpleMessage(
          simpleNotification.subject,
          simpleNotification.message
        );
        break;
      }

      case "AlarmNotification": {
        const alarmNotification = notification as AlarmNotification;
        slackMessage = this.slack.simpleMessage(
          `Cloudwatch Alarm:${alarmNotification.alert.name}`,
          alarmNotification.alert.reason
        );
        break;
      }

      case "PipelineNotification": {
        const pipelineNotification = notification as PipelineNotification;
        slackMessage = this.slack.simpleMessage(
          `Code Pipeline:${pipelineNotification.name}`,
          `Pipline Success is:${pipelineNotification.successfull}`
        );
        break;
      }
      default:
    }

    if (slackMessage) {
      await this.slack.postMessage(slackMessage, SLACK_WEBHOOK);
    }
  };
}
