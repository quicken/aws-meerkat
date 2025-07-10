import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  ManualApprovalNotification,
  SimpleNotification,
} from "../types/common";
import { Slack, SlackMessageType } from "../lib/Slack";
import { SlackRoute } from "../lib/SlackRoute";
import { Chat } from "./Chat";


/**
 * SlackChat is a class that extends the Chat class to handle sending notifications to Slack.
 * It formats different types of notifications and sends them to a specified Slack channel.
 */

export class SlackChat extends Chat {
  private slack = new Slack();
  private slackRoute = new SlackRoute();

  constructor() {
    super();
    // Load routing configuration when instantiated
    this.slackRoute.load().catch(err => {
      console.log("Failed to load slack routing configuration:", err);
    });
  }

  /** Formats and then sends a notification to Slack. */
  sendNotification = async (notification: Notification) => {
    try {
      // Default channel from environment if no routing match
      const defaultChannel = process.env.SLACK_CHANNEL || "";
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
          console.log("SlackChat: Processing pipeline notification");
          const pipelineNotification = notification as PipelineNotification;

          // Add timeout and error handling for user lookup
          let slackUserId: string | null = null;
          try {
            slackUserId = await Promise.race([
              this.slack.findSlackUserId(pipelineNotification.commit.authorEmail, pipelineNotification.commit.author),
              new Promise<null>((resolve) => {
                setTimeout(() => {
                  console.log("SlackChat: User lookup timed out, proceeding without user ID");
                  resolve(null);
                }, 5000); // 5 second timeout
              }),
            ]);
          } catch (error) {
            console.error("SlackChat: Error during user lookup:", error);
            slackUserId = null;
          }

          if (pipelineNotification.successfull) {
            slackMessage = this.slack.createPipeSuccessMessage(`Code Pipeline:${pipelineNotification.name}`, pipelineNotification.commit, slackUserId);
          } else {
            slackMessage = this.slack.createPipeFailureMessage(
              `Code Pipeline:${pipelineNotification.name}`,
              pipelineNotification.commit,
              pipelineNotification.failureDetail,
              slackUserId
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
        try {
          // Determine target channel based on routing rules
          let targetChannel = defaultChannel;
          try {
            const routedChannel = this.slackRoute.evaluateRoute(notification);
            if (routedChannel) {
              targetChannel = routedChannel;
            }
          } catch (routeError) {
            console.error("SlackChat: Error evaluating routes:", routeError);
            // Continue with default channel
          }

          await this.slack.postMessageToChannel(slackMessage, targetChannel);
        } catch (error) {
          console.error("SlackChat: Error sending message to Slack:", error);
          throw error;
        }
      } else {
        console.log("SlackChat: No message to send");
      }
    } catch (error) {
      console.error("SlackChat: Error in sendNotification:", error);
      throw error; // Re-throw to ensure Lambda handler can catch it
    }
  };
}
