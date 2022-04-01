import { Notification } from "../types/common";

export class Chat {
  sendNotification = async (notification: Notification): Promise<void> => {
    throw new Error("Implement method sendNotification.");
  };
}
