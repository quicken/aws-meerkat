import { Util } from "./Util";

interface SlackBlockType {
  type: string;
  text: string | SlackBlockType;
  emoji?: boolean;
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
  postMessage = async (
    message: SlackMessageType,
    path: string
  ): Promise<any> => {
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
}
