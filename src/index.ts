import { SNSEvent, SNSHandler, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BitBucket } from "./lib/BitBucket";
import { GitHub } from "./lib/GitHub";
import { Meerkat } from "./Meerkat";
import { version } from "../package.json";

const GIT_PROVIDER = process.env.GIT_PROVIDER || "";
const GIT_USERNAME = process.env.GIT_USERNAME || "";
const GIT_PASSWORD = process.env.GIT_PASSWORD || "";
const CHAT_SERVICE = process.env.CHAT_SERVICE || "discord";
/* Debug settings. */
const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;
const TRACE_EVENTS = process.env.TRACE_EVENTS || true;

const DYNAMO_DB = new DynamoDBClient({
  endpoint: DYNAMO_ENDPOINT,
});

const CODE_PROVIDER = GIT_PROVIDER.toLowerCase() === "bitbucket" ? new BitBucket(GIT_USERNAME, GIT_PASSWORD) : new GitHub(GIT_USERNAME, GIT_PASSWORD);

const meerkat = new Meerkat(DYNAMO_DB, CODE_PROVIDER, CHAT_SERVICE);

export const handler: SNSHandler = async (event: SNSEvent, context?: Context) => {
  console.log(`v${version}`);

  // Ensure Lambda waits for all async operations to complete
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  if (TRACE_EVENTS) {
    console.log("SNS Event:", event.Records[0].Sns.Message);
  }

  try {
    console.log("Handler: Starting meerkat.main()");
    await meerkat.main(event);
  } catch (error) {
    console.error("Handler: Error in meerkat.main():", error);
    throw error; // Re-throw to mark Lambda as failed
  }
};
