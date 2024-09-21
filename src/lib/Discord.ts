import { Util } from "./Util";
import {
  Commit,
  AlarmNotification,
  PipelineCodeBuildFailure,
  PipelineCodeDeployFailure,
  ManualApprovalAttributes,
} from "../types/common";

export interface DiscordMessageType {
  title: string;
  description: string;
  fields: any[];
  footer: string;
}

export class Discord {
  public createPipeFailureMessage(
    pipeLineName: string,
    commit: Commit,
    failureDetail:
      | PipelineCodeBuildFailure
      | PipelineCodeDeployFailure
      | undefined
  ): DiscordMessageType {
    const message: DiscordMessageType = {
      title: `:see_no_evil: ${pipeLineName}`,
      description: "",
      fields: [],
      footer: "",
    };

    const author = commit.author.length === 0 ? "" : commit.author;

    if (commit.id !== "") {
      message.fields.push(
        {
          name: `Commit: ${commit.id}`,
          value: `${commit.summary}`,
        },
        {
          name: `View Commit:`,
          value: `${commit.link}`,
        }
      );
    }

    const type = failureDetail ? failureDetail.type : "";

    switch (type) {
      case "CodeBuild":
        {
          const codeBuildFailure = failureDetail as PipelineCodeBuildFailure;

          message.title = `:hot_face: ${author} broke the build.`;
          message.description = `Pipeline: ${pipeLineName}.`;
          message.fields.push({
            name: `View Build Log:`,
            value: `${codeBuildFailure.logUrl}`,
          });
        }
        break;

      case "CodeDeploy":
        {
          const codeDeployFailure = failureDetail as PipelineCodeDeployFailure;

          message.title = `:see_no_evil: ${pipeLineName}, deployment failed. `;
          message.description = `${author}`;
          if (codeDeployFailure.summary) {
            message.fields.push({
              name: "Summary",
              value: `\`\`\`${codeDeployFailure.summary}\`\`\``,
            });
          }

          if (codeDeployFailure.id !== "") {
            for (const info of codeDeployFailure.targets) {
              if (!info || !info.diagnostics) continue;
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
    commit: Commit
  ): DiscordMessageType {
    const author = commit.author.length === 0 ? "" : commit.author;

    const message: DiscordMessageType = {
      title: `:rocket: ${pipeLineName} success.`,
      description: `${author}`,
      fields: [],
      footer: "",
    };

    if (commit.id !== "") {
      message.fields.push(
        {
          name: `Commit: ${commit.id}`,
          value: `${commit.summary}`,
        },
        {
          name: `View Commit:`,
          value: `${commit.link}`,
        }
      );
    }

    return message;
  }

  public createManualApprovalMessage(
    pipeLineName: string,
    manualAttributes: ManualApprovalAttributes
  ): DiscordMessageType {
    const message: DiscordMessageType = {
      title: `:sneeze: ${pipeLineName} requires manual approval.`,
      description: "",
      fields: [],
      footer: "",
    };

    if (manualAttributes.link !== "") {
      message.fields.push({
        name: `Review Link:`,
        value: `${manualAttributes.link}`,
      });
    }
    if (manualAttributes.comment !== "") {
      message.fields.push({
        name: `Comments:`,
        value: `${manualAttributes.comment}`,
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

  public alarmMessage(alarm: AlarmNotification): DiscordMessageType {
    const message: DiscordMessageType = {
      title: "",
      description: alarm.alert.description,
      fields: [],
      footer: "",
    };

    switch (alarm.alert.type) {
      case "alarm":
        message.title = `:face_with_symbols_over_mouth:  ${alarm.alert.name} is in alarm.`;

        const detail = "```bash\n " + alarm.alert.reason + " ```";

        message.fields.push({
          name: `Reason`,
          value: detail,
        });
        break;
      case "nag":
        message.title = `:skull_crossbones: ${alarm.alert.name} is still broken.`;
        message.description = "";
        break;
      case "recovered":
        message.title = `::partying_face: ${alarm.alert.name} recovered.`;
        break;
      case "healthy":
        message.title = `:call_me:  ${alarm.alert.name} is healthy.`;
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
