import { RawMessage, Notification } from "../types";

export class Bot {
  handleMessage = async (
    rawMessage: RawMessage
  ): Promise<Notification | null> => {
    throw new Error("Implement method sendNotification.");
    return null;
  };
}
