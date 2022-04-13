import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  ManualApprovalNotification,
  SimpleNotification,
} from "../types/common";
import { Discord, DiscordMessageType } from "../lib/Discord";
import { Chat } from "./Chat";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const DISCORD_AVATAR = process.env.DISCORD_AVATAR || "";
const DISCORD_USERNAME = process.env.DISCORD_USERNAME || "AWS Notification";

export class DiscordChat extends Chat {
  private discord = new Discord();

  /** Formats and then sends a notification to Discord. */
  sendNotification = async (notification: Notification) => {
    const GREEN = 3066993;
    const DARK_RED = 10038562;

    let color;
    let discordMessage: DiscordMessageType | null = null;

    switch (notification.type) {
      case "SimpleNotification": {
        const simpleNotification = notification as SimpleNotification;
        discordMessage = this.discord.simpleMessage(
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
        discordMessage = this.discord.alarmMessage(alarmNotification);
        break;
      }

      case "PipelineNotification": {
        const pipelineNotification = notification as PipelineNotification;
        if (pipelineNotification.successfull) {
          color = GREEN;
          discordMessage = this.discord.createPipeSuccessMessage(
            pipelineNotification.name,
            pipelineNotification.commit
          );
        } else {
          color = DARK_RED;
          discordMessage = this.discord.createPipeFailureMessage(
            pipelineNotification.name,
            pipelineNotification.commit,
            pipelineNotification.failureDetail
          );
        }

        break;
      }
      
      case "ManualApprovalNotification": {
        const manualApprovalNotification = notification as ManualApprovalNotification;
          color = GREEN;
          discordMessage = this.discord.createManualApprovalMessage(
            manualApprovalNotification.name
        );
        break;
      }
      default:
    }

    if (discordMessage) {
      await this.discord.postMessage(
        discordMessage,
        DISCORD_WEBHOOK,
        DISCORD_AVATAR,
        DISCORD_USERNAME,
        color
      );
    }
  };
}
