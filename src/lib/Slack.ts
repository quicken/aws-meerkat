import {
  Commit,
  PipelineCodeBuildFailure,
  PipelineCodeDeployFailure,
  ManualApprovalAttributes,
} from "../types/common";

const SLACK_API = "https://slack.com/api";

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
  private readonly botToken: string;

  divider: SlackBlockType = {
    type: "divider",
  };

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  /**
   * Wrapper for fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(
    url: string,
    options: any,
    timeoutMs: number = 10000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  public createPipeFailureMessage(
    pipeLineName: string,
    commit: Commit,
    failureDetail:
      | PipelineCodeBuildFailure
      | PipelineCodeDeployFailure
      | undefined,
    slackUserId: string | null,
    sourceFailure?: string,
  ): SlackMessageType {
    let author = this.mention(slackUserId);
    author = author.length === 0 ? commit.author : author;

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
        text: commit.link
          ? `>*${author}*\n>Commit: *<${commit.link}|${commit.id}>*\n>${commit.summary}`
          : commit.id && !commit.link
            ? author
              ? `>*${author}*\n>Version: *${commit.id}*`
              : `>Version: *${commit.id}*`
            : sourceFailure
              ? `>Source failed: ${sourceFailure}`
              : `>Commit details unavailable (action events not yet processed).`,
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
              if (!info?.diagnostics) continue;
              const logTail =
                "```" +
                info.diagnostics?.logTail.slice(
                  -500,
                  info.diagnostics.logTail.length,
                ) +
                "```";

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
            text: sourceFailure
              ? `*Pipeline Failed.*`
              : `*:hot_face: ${author} broke the build.*\n*Pipeline Failed.*`,
          },
        };
        message.blocks.push(defaultSection);
      }
    }

    message.blocks.push(this.divider);

    return message;
  }

  public createPipeSuccessMessage(
    pipeLineName: string,
    commit: Commit,
    slackUserId: string | null,
  ): SlackMessageType {
    let author = this.mention(slackUserId);
    author = author.length === 0 ? commit.author : author;

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
        text: commit.link
          ? `>*${author}*\n>Commit: *<${commit.link}|${commit.id}>*\n>${commit.summary}`
          : commit.id && !commit.link
            ? author
              ? `>*${author}*\n>Version: *${commit.id}*`
              : `>Version: *${commit.id}*`
            : `>Commit details unavailable.`,
      },
    };
    message.blocks.push(commitSection, this.divider);

    return message;
  }

  public createManualApprovalMessage(
    pipeLineName: string,
    manualAttributes: ManualApprovalAttributes,
    slackUserId?: string | null,
  ): SlackMessageType {
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

    const mentionLine = slackUserId ? `<@${slackUserId}>\n` : "";
    const linkLine = manualAttributes.link
      ? `\n<${manualAttributes.link}|View Approval>`
      : "";
    const approvalText = `${mentionLine}${manualAttributes.comment}${linkLine}`;

    const approvalSection: SlackBlockType = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: approvalText,
      },
    };
    message.blocks.push(approvalSection, this.divider);
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
  postMessageToChannel = async (
    message: SlackMessageType | null,
    channel: string,
  ): Promise<any> => {
    if (!message) return null;

    if (!this.botToken) {
      throw new Error("Slack bot token is required for posting to channels");
    }

    console.debug("Slack: Posting to channel:", channel);
    const response = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text: message.text,
        blocks: message.blocks,
      }),
    });

    const body = await response.json() as { ok: boolean; error?: string };
    console.debug("Slack: API response:", JSON.stringify(body));

    if (!response.ok) {
      throw new Error(
        `Slack API error: ${response.status} ${response.statusText}`,
      );
    }

    if (!body.ok) {
      console.error("Slack: API returned error:", body.error);
    }
  };

  /**
   * Find a Slack user ID by email address using the Slack Web API
   * @param email The email address to lookup
   * @returns The user ID if found, null otherwise
   */
  private async findUserByEmail(email: string): Promise<string | null> {
    if (!this.botToken) {
      console.log("No Slack bot token provided, skipping user lookup");
      return null;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${SLACK_API}/users.lookupByEmail?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.botToken}`,
          },
        },
        5000,
      ); // 5 second timeout

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
    if (!this.botToken) {
      console.log("No Slack bot token provided, skipping user lookup");
      return null;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${SLACK_API}/users.list`,
        {
          headers: {
            Authorization: `Bearer ${this.botToken}`,
          },
        },
        5000,
      ); // 5 second timeout

      const data = (await response.json()) as SlackUsersListResponse;

      if (data.ok && data.members) {
        const user = data.members.find(
          (member: SlackUser) =>
            member.real_name === name ||
            member.display_name === name ||
            member.name === name,
        );

        if (user?.id) {
          return user.id;
        }
      }

      return null;
    } catch (error) {
      console.log("Failed to lookup user by name:", error);
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
      const nameMatch = new RegExp(/^([^<]+)/).exec(authorName);
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
