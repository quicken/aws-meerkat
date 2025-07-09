import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  ManualApprovalNotification,
  SimpleNotification,
} from "../types/common";
import { Slack, SlackMessageType } from "../lib/Slack";
import { Chat } from "./Chat";

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || "";

export class SlackChat extends Chat {
  private slack = new Slack();

  /** Formats and then sends a notification to Slack. */
  sendNotification = async (notification: Notification) => {
    let slackMessage: SlackMessageType | null = null;

    switch (notification.type) {
      case "SimpleNotification": {
        const simpleNotification = notification as SimpleNotification;
        slackMessage = this.slack.simpleMessage(simpleNotification.subject, simpleNotification.message);
        break;
      }

      case "AlarmNotification": {
        const alarmNotification = notification as AlarmNotification;
        slackMessage = this.slack.simpleMessage(`Cloudwatch Alarm:${alarmNotification.alert.name}`, alarmNotification.alert.reason);
        break;
      }

      case "PipelineNotification": {
        const pipelineNotification = notification as PipelineNotification;
        if (pipelineNotification.successfull) {
          slackMessage = this.slack.createPipeSuccessMessage(`Code Pipeline:${pipelineNotification.name}`, pipelineNotification.commit);
        } else {
          slackMessage = this.slack.createPipeFailureMessage(
            `Code Pipeline:${pipelineNotification.name}`,
            pipelineNotification.commit,
            pipelineNotification.failureDetail
          );
        }
        break;
      }

      case "ManualApprovalNotification": {
        const manualApprovalNotification = notification as ManualApprovalNotification;
        slackMessage = this.slack.createManualApprovalMessage(manualApprovalNotification.name, manualApprovalNotification.approvalAttributes);
        break;
      }
      default:
    }

    if (slackMessage) {
      await this.slack.postMessage(slackMessage, SLACK_WEBHOOK);
    }
  };
}
