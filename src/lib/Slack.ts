import { Util } from "./Util";
import {
  Commit,
  AlarmNotification,
  PipelineCodeBuildFailure,
  PipelineCodeDeployFailure,
  ManualApprovalAttributes,
} from "../types/common";

interface SlackBlockType {
  type: string;
  text?: string | SlackBlockType;
  accessory?: SlackBlockType;
  elements?: SlackBlockType[];
  emoji?: boolean;
  value?: string;
  url?: string;
  action_id?: string;
}

interface SlackSectionType {
  type: "section";
  fields: SlackBlockType[];
}

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

export interface SlackMessageType {
  text: string;
  blocks: (SlackSectionType | SlackBlockType)[];
}

export class Slack {
  divider: SlackBlockType = {
    type: "divider",
  };

  public createPipeFailureMessage(
    pipeLineName: string,
    commit: Commit,
    failureDetail: PipelineCodeBuildFailure | PipelineCodeDeployFailure | undefined,
    slackUserId: string | null
  ): SlackMessageType {
    const author = commit.author.length === 0 ? "" : commit.author;

    const message: SlackMessageType = {
      text: `:bulb: Received a AWS Notification`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:x: :japanese_goblin: ${pipeLineName} is broken.`,
            emoji: true,
          },
        },
      ],
    };

    const commitSection: SlackBlockType = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `>*${author}*\n>Commit: *<${commit.link}|${commit.id}>*\n>${commit.summary}`,
      },
    };
    message.blocks.push(commitSection);

    const type = failureDetail ? failureDetail.type : "";
    switch (type) {
      case "CodeBuild":
        {
          const codeBuildFailure = failureDetail as PipelineCodeBuildFailure;
          const buildSection: SlackBlockType = {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View build log",
                  emoji: true,
                },
                url: `${codeBuildFailure.logUrl}`,
              },
            ],
          };
          message.blocks.push(buildSection);
        }
        break;
      case "CodeDeploy":
        {
          const codeDeployFailure = failureDetail as PipelineCodeDeployFailure;

          if (codeDeployFailure.summary) {
            const deploySummary: SlackBlockType = {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${codeDeployFailure.summary}*`,
              },
            };
            message.blocks.push(deploySummary);
          }

          if (codeDeployFailure.id !== "") {
            for (const info of codeDeployFailure.targets) {
              if (!info || !info.diagnostics) continue;
              const logTail = "```" + info.diagnostics?.logTail.slice(info.diagnostics.logTail.length - 500, info.diagnostics.logTail.length) + "```";

              const targetInfo: SlackBlockType = {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `Instance Id: *${info.instanceid}*\n _${info.diagnostics?.scriptName}_\n${logTail}`,
                },
              };
              message.blocks.push(targetInfo);
            }
          }
        }
        break;
      default: {
        const defaultSection: SlackBlockType = {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*:hot_face: ${author} broke the build.*\n*Pipeline Failed.*`,
          },
        };
        message.blocks.push(defaultSection);
      }
    }

    message.blocks.push(this.divider);

    return message;
  }

  public createPipeSuccessMessage(pipeLineName: string, commit: Commit, slackUserId: string | null): SlackMessageType {
    const author = commit.author.length === 0 ? "" : commit.author;

    const message: SlackMessageType = {
      text: `:bulb: Received a AWS Notification`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:white_check_mark: :rocket: ${pipeLineName} success.   `,
            emoji: true,
          },
        },
      ],
    };

    const commitSection: SlackBlockType = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `>*${author}* ${this.mention(slackUserId)}\n>Commit: *<${commit.link}|${commit.id}>*\n>${commit.summary}`,
      },
    };
    message.blocks.push(commitSection);
    message.blocks.push(this.divider);

    return message;
  }

  public createManualApprovalMessage(pipeLineName: string, manualAttributes: ManualApprovalAttributes): SlackMessageType {
    const message: SlackMessageType = {
      text: `:bulb: Received a AWS Notification`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:warning: :building_construction: ${pipeLineName} requires manual approval.`,
            emoji: true,
          },
        },
      ],
    };

    const approvalSection: SlackBlockType = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${manualAttributes.comment}\n<${manualAttributes.link}|View Approval>`,
      },
    };
    message.blocks.push(approvalSection);
    message.blocks.push(this.divider);
    return message;
  }

  public simpleMessage(subject: string, message: string): SlackMessageType {
    return {
      text: `:bulb: Received a AWS Notification`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: subject,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `${message}\n`,
            },
          ],
        },
      ],
    };
  }

  /**
   * Post message to Slack channel using Bot API
   * @param message The message to post, or null to skip
   * @param channel The channel ID or name to post to
   * @returns Promise resolving to API response
   */
  postMessageToChannel = async (message: SlackMessageType | null, channel: string): Promise<any> => {
    if (!message) return null;

    const slackBotToken = process.env.SLACK_BOT_TOKEN;
    if (!slackBotToken) {
      throw new Error("SLACK_BOT_TOKEN is required for posting to channels");
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text: message.text,
        blocks: message.blocks,
      }),
    });

    await response.json();
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }
  };

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
   * Find the slack user id of a commit author.
   *
   * @param authorEmail The author's email address
   * @param authorName The author's name (fallback if email lookup fails)
   * @returns The slack user id
   */
  public async findSlackUserId(authorEmail?: string, authorName?: string) {
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

    return userId;
  }

  /**
   *
   * @param slackUserId The slack user id to mention
   * @returns
   */
  private mention(slackUserId: string | null): string {
    if (!slackUserId) return "";
    return `<@${slackUserId}>`;
  }
}
