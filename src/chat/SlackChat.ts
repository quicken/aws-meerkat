import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  ManualApprovalNotification,
  SimpleNotification,
} from "../types/common";
import { Slack, SlackMessageType } from "../lib/Slack";
import { Chat } from "./Chat";


// Slack API response types
interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  display_name: string;
}

interface SlackUserLookupResponse {
  ok: boolean;
  user?: SlackUser;
  error?: string;
}

interface SlackUsersListResponse {
  ok: boolean;
  members?: SlackUser[];
  error?: string;
}

export class SlackChat extends Chat {
  private slack = new Slack();

  /**
   * Find a Slack user ID by email address using the Slack Web API
   * @param email The email address to lookup
   * @returns The user ID if found, null otherwise
   */
  private async findUserByEmail(email: string): Promise<string | null> {
    const slackBotToken = process.env.SLACK_BOT_TOKEN || "";

    if (!slackBotToken) {
      return null;
    }

    try {
      const response = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${slackBotToken}`,
        },
      });

      const data = (await response.json()) as SlackUserLookupResponse;

      if (data.ok && data.user?.id) {
        return data.user.id;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Failed to lookup user by email:", error);
      return null;
    }
  }

  /**
   * Find a Slack user ID by searching through all users by name
   * @param name The display name or real name to search for
   * @returns The user ID if found, null otherwise
   */
  private async findUserByName(name: string): Promise<string | null> {
    const slackBotToken = process.env.SLACK_BOT_TOKEN || "";

    if (!slackBotToken) {
      return null;
    }

    try {
      const response = await fetch("https://slack.com/api/users.list", {
        headers: {
          Authorization: `Bearer ${slackBotToken}`,
        },
      });

      const data = (await response.json()) as SlackUsersListResponse;

      if (data.ok && data.members) {
        const user = data.members.find((member: SlackUser) => member.real_name === name || member.display_name === name || member.name === name);

        if (user?.id) {
          return user.id;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to lookup user by name:", error);
      return null;
    }
  }

  /**
   * Add user mention to message if user can be found
   * @param message The original message
   * @param authorEmail The author's email address
   * @param authorName The author's name (fallback if email lookup fails)
   * @returns The message with user mention prepended if user found
   */
  private async addUserMention(message: string, authorEmail?: string, authorName?: string): Promise<string> {
    let userId: string | null = null;

    // Try to find user by email first
    if (authorEmail) {
      userId = await this.findUserByEmail(authorEmail);
    }

    // Fallback to name lookup if email lookup failed
    if (!userId && authorName) {
      // Extract just the name part if it's in "Name <email>" format
      const nameMatch = authorName.match(/^([^<]+)/);
      const cleanName = nameMatch ? nameMatch[1].trim() : authorName;
      userId = await this.findUserByName(cleanName);
    }

    // Add mention if user found
    if (userId) {
      return `<@${userId}> ${message}`;
    }

    return message;
  }

  /** Formats and then sends a notification to Slack. */
  sendNotification = async (notification: Notification) => {
    const slackWebhook = process.env.SLACK_WEBHOOK || "";
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
          // For pipeline failures, try to mention the commit author
          const originalMessage = `Code Pipeline:${pipelineNotification.name}`;
          const messageWithMention = await this.addUserMention(originalMessage, pipelineNotification.commit.authorEmail, pipelineNotification.commit.author);

          slackMessage = this.slack.createPipeFailureMessage(messageWithMention, pipelineNotification.commit, pipelineNotification.failureDetail);
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
      await this.slack.postMessage(slackMessage, slackWebhook);
    }
  };
}
