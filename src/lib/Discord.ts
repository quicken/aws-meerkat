import { Util } from "./Util";
import {
  CommitType,
  LogEntryType,
  BuildLogEntryType,
  DeployLogEntryType,
  AlarmType,
} from "../types";
import { Z_FILTERED } from "zlib";

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

  public alarmMessage(alert: AlarmType): DiscordMessageType {
    const message: DiscordMessageType = {
      title: "",
      description: alert.description,
      fields: [],
      footer: "",
    };

    switch (alert.type) {
      case "alarm":
        message.title = `:face_with_symbols_over_mouth:  ${alert.name} is in alarm.`;

        const detail = "```bash\n " + alert.reason + " ```";

        message.fields.push({
          name: `Reason`,
          value: detail,
        });
        break;
      case "nag":
        message.title = `:skull_crossbones: ${alert.name} is still broken.`;
        message.description = "";
        break;
      case "recovered":
        message.title = `::partying_face: ${alert.name} recovered.`;
        break;
      case "healthy":
        message.title = `:call_me:  ${alert.name} is healthy.`;
        message.description = "";
        break;
    }

    return message;
  }

  /**
   *
   * @param message
   * @param path
   * @param avatar
   * @param color A discord color code. https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812
   * @returns
   */
  postMessage = async (
    message: DiscordMessageType,
    path: string,
    avatar: string,
    username: string,
    color: number = 3447003 /* Blue */
  ): Promise<any> => {
    /*
    https://discord.com/developers/docs/resources/webhook#execute-webhook
    https://discord.com/developers/docs/resources/channel#embed-object
    */
    const content = JSON.stringify({
      username: username,
      avatar_url: avatar,
      content: "",
      embeds: [
        {
          title: message.title,
          color: color,
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
