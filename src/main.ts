import {
  DynamoDBClient,
  GetItemCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const BITBUCKET = {
  username: process.env.BITBUCKET_USERNAME,
  password: process.env.BITBUCKET_PASSWORD,
};

console.table(process.env.CFKIT_HOME);
console.log(BITBUCKET.username, BITBUCKET.password);

const foo = async () => {
  const client = new DynamoDBClient({ region: "ap-southeast-2" });
  const command = new ListTablesCommand({});
  const response = await client.send(command);
  console.log(response);
};

foo();
