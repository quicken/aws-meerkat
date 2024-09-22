import "dotenv/config";
import { Slack } from "../../src/lib/Slack";
import {
  Commit,
  AlarmNotification,
  PipelineCodeBuildFailure,
  PipelineCodeDeployFailure,
  ManualApprovalAttributes,
} from "../../src/types/common";

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || "";

test("create-default-message", async () => {
  const slack = new Slack();
  const message = slack.simpleMessage("Hello", "World");
  //await slack.postMessage(message, SLACK_WEBHOOK);

  expect(1).toBe(1);
});

test("create-default-failed-message", async () => {
  const commit: Commit = {
    id: "123456",
    author: "Jack Sparrow",
    summary: "Retighten the spiggot on the warp-drive",
    link: "http://www.github.com",
  };

  const buildFailure: PipelineCodeBuildFailure = {
    type: "CodeBuild",
    logUrl: "https://github.com/quicken/aws-code-pipeline-monitor",
  };

  const slack = new Slack();
  const message = slack.createPipeFailureMessage(
    "Unit-Test",
    commit,
    buildFailure
  );

  //await slack.postMessage(message, SLACK_WEBHOOK);

  expect(1).toBe(1);
});

test("create-deploy-failed-message", async () => {
  const commit: Commit = {
    id: "123456",
    author: "Jack Sparrow",
    summary: "Retighten the spiggot on the warp-drive",
    link: "http://www.github.com",
  };

  const deployFailure: PipelineCodeDeployFailure = {
    type: "CodeDeploy",
    id: "123456",
    summary: "Deployment d-38E5IUD1C failed",
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
  };

  const slack = new Slack();
  const message = slack.createPipeFailureMessage(
    "Unit-Test",
    commit,
    deployFailure
  );

  //await slack.postMessage(message, SLACK_WEBHOOK);
  expect(1).toBe(1);
});

test("create-pipeline-success-message", async () => {
  const commit: Commit = {
    id: "123456",
    author: "Jack Sparrow",
    summary: "Retighten the spiggot on the warp-drive",
    link: "http://www.github.com",
  };

  const slack = new Slack();
  const message = slack.createPipeSuccessMessage("unit-test", commit);
  //await slack.postMessage(message, SLACK_WEBHOOK);

  expect(1).toBe(1);
});

test("create-manual-approval-required-message", async () => {
  const approvalAttributes: ManualApprovalAttributes = {
    link: "http://www.github.com",
    comment: "Retighten the spiggot on the warp-drive",
  };

  const slack = new Slack();
  const message = slack.createManualApprovalMessage(
    "unit-test",
    approvalAttributes
  );
  //await slack.postMessage(message, SLACK_WEBHOOK);

  expect(1).toBe(1);
});
// worked for one hour
