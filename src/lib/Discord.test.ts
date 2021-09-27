import "dotenv/config";
import { Discord } from "./Discord";
import {
  CommitType,
  LogEntryType,
  BuildLogEntryType,
  DeployLogEntryType,
  AlarmType,
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

test("send-alarm", async () => {
  const alarm: AlarmType = {
    name: "my-system-lb",
    description: "This is my Alarm",
    reason:
      "Threshold Crossed: 2 out of the last 2 datapoints [5.535714886726143 (27/09/21 01:36:00), 1.7514244573552422 (27/09/21 01:35:00)] were greater than the threshold (1.0) (minimum 2 datapoints for OK -> ALARM transition).",
    date: 1632706699630,
    type: "nag",
  };

  const discord = new Discord();
  const message = discord.alarmMessage(alarm);

  discord.postMessage(
    message,
    DISCORD_WEBHOOK,
    DISCORD_AVATAR,
    DISCORD_USERNAME
  );

  // expect(message.description).toBe("This is my Alarm");
});
