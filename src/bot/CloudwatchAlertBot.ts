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
    rawMessage: RawMessage
  ): Promise<AlarmNotification | null> => {
    let type: "alarm" | "nag" | "recovered" | "healthy" = "alarm";

    if (rawMessage.body + "" === rawMessage.body) return null;
    const event = rawMessage.body as Record<string, unknown>;

    if (event.NewStateValue === event.OldStateValue) {
      if (event.NewStateValue === "OK") {
        type = "healthy";
      } else {
        type = "nag";
      }
    } else {
      if (event.NewStateValue === "OK" && event.OldStateValue === "ALARM") {
        type = "recovered";
      }
    }

    return {
      type: "AlarmNotification",
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
