import { RawMessage, AlarmNotification } from "../types/common";
import { Bot } from "./Bot";

export class CloudWatchAlertBot extends Bot {
  /**
   * Converts rawMessage into a cloudwatch alarm notification.
   * If the raw message body is a string returns null.
   * @param rawMessage
   * @returns
   */
  handleMessage = async (
    rawMessage: RawMessage,
  ): Promise<AlarmNotification | null> => {
    let type: "alarm" | "nag" | "recovered" | "healthy" = "alarm";

    if (typeof rawMessage.body === "string") return null;
    const event = rawMessage.body;

    if (event.NewStateValue === event.OldStateValue) {
      if (event.NewStateValue === "OK") {
        type = "healthy";
      } else {
        type = "nag";
      }
    } else if (
      event.NewStateValue === "OK" &&
      event.OldStateValue === "ALARM"
    ) {
      type = "recovered";
    }

    return {
      type: "AlarmNotification",
      account: event.AWSAccountId as string,
      alert: {
        type: type,
        name: event.AlarmName as string,
        description: event.AlarmDescription as string,
        reason: event.NewStateReason,
        date: new Date(event.StateChangeTime as string).getTime(),
      },
    };
  };
}
