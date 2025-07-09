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
   *
   * @param message
   * @param path
   * @returns
   */
  postMessage = async (message: SlackMessageType, path: string): Promise<any> => {
    const content = JSON.stringify(message);

    const options = {
      hostname: "hooks.slack.com",
      port: 443,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": content.length,
      },
    };

    return Util.callEndpoint(options, content);
  };

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
   *
   * @param slackUserId The slack user id to mention
   * @returns
   */
  private mention(slackUserId: string | null): string {
    if (!slackUserId) return "";
    return `<@${slackUserId}>`;
  }
}
