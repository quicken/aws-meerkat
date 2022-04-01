import { SNSEvent, SNSHandler, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BitBucket } from "./lib/BitBucket";
import { GitHub } from "./lib/GitHub";
import { Meerkat } from "./MeerkatBot";

const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;
const GIT_PROVIDER = process.env.GIT_PROVIDER || "";
const GIT_USERNAME = process.env.GIT_USERNAME || "";
const GIT_PASSWORD = process.env.GIT_PASSWORD || "";

const CODE_PROVIDER =
  GIT_PROVIDER.toLowerCase() === "bitbucket"
    ? new BitBucket(GIT_USERNAME, GIT_PASSWORD)
    : new GitHub(GIT_USERNAME, GIT_PASSWORD);

const DYNAMO_DB = new DynamoDBClient({
  endpoint: DYNAMO_ENDPOINT,
});

const meerkat = new Meerkat(DYNAMO_DB, CODE_PROVIDER);

export const handler: SNSHandler = async (
  event: SNSEvent,
  context?: Context
) => {
  console.log("v1.3.0");
  await meerkat.processSnsEvent(event);
};
