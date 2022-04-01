import { RawMessage, Notification } from "../types";

export class Bot {
  /**
   * This method is called when a bot should process an incoming message.
   * @param rawMessage
   * @returns
   */
  handleMessage = async (
    rawMessage: RawMessage
  ): Promise<Notification | null> => {
    throw new Error("Implement method sendNotification.");
    return null;
  };

  /**
   * The method is called after a notification has been sent by a Chat.
   *
   * @returns
   */
  notificationSent = async (): Promise<void> => {
    return;
  };
}
