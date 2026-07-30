import { SNSEvent, SNSHandler, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Meerkat } from "./Meerkat";
import { version } from "../package.json";

const CHAT_SERVICE = process.env.CHAT_SERVICE || "discord";
const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;

const DYNAMO_DB = new DynamoDBClient({
  endpoint: DYNAMO_ENDPOINT,
});

const meerkat = new Meerkat(DYNAMO_DB, CHAT_SERVICE);

export const handler: SNSHandler = async (event: SNSEvent, context?: Context) => {
  console.log(`v${version}`);

  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
    // Extract Lambda's own account ID from function ARN for same-account detection
    meerkat.lambdaAccount = context.invokedFunctionArn?.split(":")[4] ?? "";
  }

  console.debug("SNS Event:", event.Records[0].Sns.Message);

  try {
    console.log("Handler: Starting meerkat.main()");
    await meerkat.main(event);
  } catch (error) {
    console.error("Handler: Error in meerkat.main():", error);
    throw error;
  }
};
