import { Util } from "./Util";
import {
  CommitType,
  LogEntryType,
  BuildLogEntryType,
  DeployLogEntryType,
} from "../types";

interface DiscordMessageType {
  title: string;
  description: string;
  fields: any[];
  footer: string;
}

export class Discord {
  public createPipeFailureMessage(
    pipeLineName: string,
    commit: CommitType,
    logEntry: LogEntryType
  ): DiscordMessageType {
    const message: DiscordMessageType = {
      title: `:see_no_evil: ${pipeLineName}`,
      description: "",
      fields: [],
      footer: "",
    };

    const author = commit.author.length === 0 ? "" : commit.author;

    if (commit.id !== "") {
      message.fields.push({
        name: `Commit: ${commit.id}`,
        value: `${commit.summary}`,
      });
    }

    switch (logEntry.type) {
      case "build":
        {
          const buildLog = logEntry as BuildLogEntryType;

          message.title = `:hot_face: ${author} broke the build.`;
          message.description = `Pipeline: ${pipeLineName}.`;
          message.fields.push({
            name: `View Build Log:`,
            value: `${buildLog.build.logUrl}`,
          });
        }
        break;

      case "deploy":
        {
          const deployLog = logEntry as DeployLogEntryType;

          message.title = `:see_no_evil: ${pipeLineName}, deployment failed. `;
          message.description = `${author}`;
          if (deployLog.summary) {
            message.fields.push({
              name: "Summary",
              value: `\`\`\`${deployLog.summary}\`\`\``,
            });
          }

          if (deployLog.id !== "") {
            for (const info of deployLog.deploy.targets) {
              if (!info.diagnostics) continue;
              const logTail =
                "```bash\n " +
                info.diagnostics?.logTail.slice(
                  info.diagnostics.logTail.length - 500,
                  info.diagnostics.logTail.length
                ) +
                " ```";
              message.fields.push({
                name: `${info.diagnostics?.scriptName}`,
                value: `Deployment failed to instance id:\n ${info.instanceid}  ${logTail}`,
              });
            }
          }
        }
        break;

      default:
        message.title = `:hot_face: ${author} broke the build.`;
        message.description = "Pipeline Failed.";
    }

    return message;
  }

  public createPipeSuccessMessage(
    pipeLineName: string,
    commit: CommitType
  ): DiscordMessageType {
    const author = commit.author.length === 0 ? "" : commit.author;

    const message: DiscordMessageType = {
      title: `:rocket: ${pipeLineName} success.`,
      description: `${author}`,
      fields: [],
      footer: "",
    };

    if (commit.id !== "") {
      message.fields.push({
        name: `Commit: ${commit.id}`,
        value: `${commit.summary}`,
      });
    }

    return message;
  }

  public simpleMessage(subject: string, message: string): DiscordMessageType {
    return {
      title: `:skull_crossbones: ${subject}`,
      description: message,
      fields: [],
      footer: "",
    };
  }

  /**
   *
   * @param message
   * @param path
   * @param avatar
   * @returns
   */
  postMessage = async (
    message: DiscordMessageType,
    path: string,
    avatar: string
  ): Promise<any> => {
    const content = JSON.stringify({
      username: "AWS Notification",
      avatar_url: avatar,
      content: "",
      embeds: [
        {
          title: message.title,
          color: 10038562,
          description: message.description,
          fields: message.fields,
          footer: {
            text: message.footer,
          },
        },
      ],
    });

    const options = {
      hostname: "discord.com",
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
}
