import "dotenv/config";
import { Slack } from "../../src/lib/Slack";
import { Commit, PipelineCodeBuildFailure, PipelineCodeDeployFailure, ManualApprovalAttributes } from "../../src/types/common";

const INTEGRATION_TESTS = process.env.INTEGRATION_TESTS === "true";
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || "";

describe("Slack", () => {
  let slack: Slack;

  beforeEach(() => {
    slack = new Slack();
  });

  describe("Message Creation", () => {
    it("should create a default message", async () => {
      const message = slack.simpleMessage("Hello", "World");
      if (INTEGRATION_TESTS) {
        await slack.postMessageToChannel(message, SLACK_CHANNEL);
      }
      expect(message).toBeDefined();
    });

    describe("Pipeline Failure Messages", () => {
      const baseCommit: Commit = {
        id: "123456",
        author: "Jack Sparrow",
        summary: "Retighten the spiggot on the warp-drive",
        link: "http://www.github.com",
      };

      it("should create a build failure message", async () => {
        const buildFailure: PipelineCodeBuildFailure = {
          type: "CodeBuild",
          logUrl: "https://github.com/quicken/aws-code-pipeline-monitor",
        };

        const message = slack.createPipeFailureMessage("Unit-Test", baseCommit, buildFailure, "");

        if (INTEGRATION_TESTS) {
          await slack.postMessageToChannel(message, SLACK_CHANNEL);
        }
        expect(message).toBeDefined();
      });

      it("should create a deployment failure message", async () => {
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

        const message = slack.createPipeFailureMessage("Unit-Test", baseCommit, deployFailure, null);

        if (INTEGRATION_TESTS) {
          await slack.postMessageToChannel(message, SLACK_CHANNEL);
        }
        expect(message).toBeDefined();
      });
    });

    describe("Pipeline Success Messages", () => {
      it("should create a pipeline success message", async () => {
        const commit: Commit = {
          id: "123456",
          author: "Jack Sparrow",
          summary: "Retighten the spiggot on the warp-drive",
          link: "http://www.github.com",
        };

        const message = slack.createPipeSuccessMessage("unit-test", commit, null);
        if (INTEGRATION_TESTS) {
          await slack.postMessageToChannel(message, SLACK_CHANNEL);
        }
        expect(message).toBeDefined();
      });
    });

    describe("Manual Approval Messages", () => {
      it("should create a manual approval required message", async () => {
        const approvalAttributes: ManualApprovalAttributes = {
          link: "http://www.github.com",
          comment: "Retighten the spiggot on the warp-drive",
        };

        const message = slack.createManualApprovalMessage("unit-test", approvalAttributes);
        if (INTEGRATION_TESTS) {
          await slack.postMessageToChannel(message, SLACK_CHANNEL);
        }
        expect(message).toBeDefined();
      });
    });
  });
});
