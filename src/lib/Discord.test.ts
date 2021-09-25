import "dotenv/config";
import { Discord } from "./Discord";
import {
  CommitType,
  LogEntryType,
  BuildLogEntryType,
  DeployLogEntryType,
} from "../types";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || "";
const DISCORD_AVATAR = process.env.DISCORD_AVATAR || "";
const DISCORD_USERNAME = process.env.DISCORD_USERNAME || "AWS Notification";

test("create-default-failed-message", async () => {
  const commit: CommitType = {
    id: "123456",
    author: "Jack Sparrow",
    summary: "Retighten the spiggot on the warp-drive",
    link: "http://www.github.com",
  };

  const logEntry: LogEntryType = {
    id: "123456",
    type: "unknown",
    name: "What name",
    message: "Something has happened",
  };

  const discord = new Discord();
  const message = discord.createPipeFailureMessage(
    "Unit-Test",
    commit,
    logEntry
  );

  // discord.postMessage(message,DISCORD_WEBHOOK,DISCORD_AVATAR,DISCORD_USERNAME);
  expect(message.description).toBe("Pipeline Failed.");
});

test("create-build-failed-message", async () => {
  const commit: CommitType = {
    id: "123456",
    author: "Jack Sparrow",
    summary: "Retighten the spiggot on the warp-drive",
    link: "http://www.github.com",
  };

  const logEntry: BuildLogEntryType = {
    id: "123456",
    type: "build",
    name: "What name",
    message: "Something has happened",
    build: {
      logUrl: "https://github.com/quicken/aws-code-pipeline-monitor",
    },
  };

  const discord = new Discord();
  const message = discord.createPipeFailureMessage(
    "Unit-Test",
    commit,
    logEntry
  );

  // discord.postMessage(message,DISCORD_WEBHOOK,DISCORD_AVATAR,DISCORD_USERNAME);
  expect(message.fields[0].name).toBe("Commit: 123456");
  expect(message.fields[1].name).toBe("View Build Log:");
});

test("create-deploy-failed-message", async () => {
  const commit: CommitType = {
    id: "123456",
    author: "Jack Sparrow",
    summary: "Retighten the spiggot on the warp-drive",
    link: "http://www.github.com",
  };

  const logEntry: DeployLogEntryType = {
    id: "123456",
    type: "deploy",
    name: "What name",
    summary: "Deployment d-38E5IUD1C failed",
    deploy: {
      targets: [
        { instanceid: "instance-1", diagnostics: null },
        {
          instanceid: "instance-2",
          diagnostics: {
            errorCode: "",
            logTail: `. Migration of schema [dbo] may not be reproducible.
            [stdout]Migrating schema [dbo] to version "2021.09.08.14.55 - Swap Login Creation Link for User Login Access Link in templates"
            [stderr]Terminated`,
            message: "",
            scriptName: "deploy/scripts/flyway_migrate.sh",
          },
        },
      ],
    },
  };

  const discord = new Discord();
  const message = discord.createPipeFailureMessage(
    "Unit-Test",
    commit,
    logEntry
  );

  // discord.postMessage(message,DISCORD_WEBHOOK,DISCORD_AVATAR,DISCORD_USERNAME);
  expect(message.fields.length).toBe(3);
});
