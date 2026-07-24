import {
  Notification,
  AlarmNotification,
  PipelineNotification,
  ManualApprovalNotification,
  SimpleNotification,
} from "../types/common";
import { Discord, DiscordMessageType } from "../lib/Discord";
import { Chat } from "./Chat";

export interface DiscordConfig {
  webhook: string;
  avatar?: string;
  username?: string;
}

export class DiscordChat extends Chat {
  private readonly discord = new Discord();
  private readonly accountNames: Record<string, string>;
  private readonly webhook: string;
  private readonly avatar: string;
  private readonly username: string;

  constructor(accountNames: Record<string, string> = {}, config: DiscordConfig = { webhook: "" }) {
    super();
    this.accountNames = accountNames;
    this.webhook = config.webhook;
    this.avatar = config.avatar ?? "";
    this.username = config.username ?? "AWS Notification";
  }

  /** Formats and then sends a notification to Discord. */
  sendNotification = async (notification: Notification) => {
    const GREEN = 3066993;
    const YELLOW = 16705372;
    const DARK_RED = 10038562;

    let color;
    let discordMessage: DiscordMessageType | null = null;

    switch (notification.type) {
      case "SimpleNotification": {
        const simpleNotification = notification as SimpleNotification;
        discordMessage = this.discord.simpleMessage(
          simpleNotification.subject,
          simpleNotification.message,
        );
        break;
      }

      case "AlarmNotification": {
        const alarmNotification = notification as AlarmNotification;

        color = ["alarm", "nag"].includes(alarmNotification.alert.type)
          ? DARK_RED
          : GREEN;
        discordMessage = this.discord.alarmMessage(
          alarmNotification,
          this.accountNames[alarmNotification.account],
        );
        break;
      }

      case "PipelineNotification": {
        const pipelineNotification = notification as PipelineNotification;
        const name = this.withAccountLabel(
          pipelineNotification.name,
          pipelineNotification.account,
        );
        if (pipelineNotification.successfull) {
          color = GREEN;
          discordMessage = this.discord.createPipeSuccessMessage(
            name,
            pipelineNotification.commit,
          );
        } else {
          color = DARK_RED;
          discordMessage = this.discord.createPipeFailureMessage(
            name,
            pipelineNotification.commit,
            pipelineNotification.failureDetail,
            pipelineNotification.sourceFailure,
          );
        }

        break;
      }

      case "ManualApprovalNotification": {
        const manualApprovalNotification =
          notification as ManualApprovalNotification;
        color = YELLOW;
        const approvalName = this.withAccountLabel(
          `Code Pipeline: ${manualApprovalNotification.name}`,
          manualApprovalNotification.account,
        );
        discordMessage = this.discord.createManualApprovalMessage(
          approvalName,
          manualApprovalNotification.approvalAttributes,
        );
        break;
      }
      default:
    }

    if (discordMessage) {
      await this.discord.postMessage(
        discordMessage,
        this.webhook,
        this.avatar,
        this.username,
        color,
      );
    }
  };

  private withAccountLabel(title: string, accountId: string): string {
    const name = this.accountNames[accountId];
    return name ? `${title} [${name}]` : title;
  }
}
