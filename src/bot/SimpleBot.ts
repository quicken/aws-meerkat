import { RawMessage, SimpleNotification } from "../types";
import { Bot } from "./Bot";

export class SimpleBot extends Bot {
  /**
   * Converts rawMessage into simple message. If the raw message body is not a string return null.
   * @param rawMessage
   * @returns
   */
  handleMessage = async (
    rawMessage: RawMessage
  ): Promise<SimpleNotification | null> => {
    if (rawMessage.body + "" !== rawMessage.body) return null;
    return {
      type: "SimpleNotification",
      subject: rawMessage.subject,
      message: rawMessage.body,
    };
  };
}
