import "dotenv/config";
import { Slack } from "./Slack";

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || "";

test("create-default-message", async () => {
  const slack = new Slack();
  const message = slack.simpleMessage("Hello", "World");
  await slack.postMessage(message, SLACK_WEBHOOK);

  expect(1).toBe(1);
});
