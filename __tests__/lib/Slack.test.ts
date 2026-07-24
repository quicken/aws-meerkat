import "dotenv/config";
import { Slack } from "../../src/lib/Slack";
import { Commit, PipelineCodeBuildFailure, PipelineCodeDeployFailure, ManualApprovalAttributes } from "../../src/types/common";

const INTEGRATION_TESTS = process.env.INTEGRATION_TESTS === "true";
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || "";

// Mock fetch globally
global.fetch = jest.fn();

describe("Slack", () => {
  let slack: Slack;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const originalEnv = process.env;

  beforeEach(() => {
    mockFetch.mockClear();
    jest.spyOn(console, "log").mockImplementation(() => {});
    slack = new Slack("xoxb-test-token");

    // Mock environment variables
    process.env = {
      ...originalEnv,
      SLACK_WEBHOOK: "https://hooks.slack.com/test",
      SLACK_BOT_TOKEN: "xoxb-test-token",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("User Lookup", () => {
    it("should find user by email", async () => {
      // Mock successful user lookup by email
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          user: { id: "U1234567890", name: "john.doe" },
        }),
      } as Response);

      const userId = await slack.findSlackUserId("john.doe@example.com", "John Doe");

      // Verify user lookup was called
      expect(mockFetch).toHaveBeenCalledWith(
        "https://slack.com/api/users.lookupByEmail?email=john.doe%40example.com",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer xoxb-test-token",
          }),
        })
      );

      expect(userId).toBe("U1234567890");
    });

    it("should fallback to name lookup when email lookup fails", async () => {
      // Mock failed email lookup, successful name lookup
      mockFetch
        .mockResolvedValueOnce({
          json: async () => ({
            ok: false,
            error: "users_not_found",
          }),
        } as Response)
        .mockResolvedValueOnce({
          json: async () => ({
            ok: true,
            members: [{ id: "U1234567890", name: "john.doe", real_name: "John Doe", display_name: "John" }],
          }),
        } as Response);

      const userId = await slack.findSlackUserId("john.doe@example.com", "John Doe");

      // Verify both email and name lookup were called
      expect(mockFetch).toHaveBeenCalledWith(
        "https://slack.com/api/users.lookupByEmail?email=john.doe%40example.com",
        expect.anything()
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://slack.com/api/users.list",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer xoxb-test-token",
          }),
        })
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(userId).toBe("U1234567890");
    });

    it("should return null without bot token configured", async () => {
      const slackNoToken = new Slack("");

      const userId = await slackNoToken.findSlackUserId("john.doe@example.com", "John Doe");

      // Should not call user lookup APIs
      expect(mockFetch).not.toHaveBeenCalled();
      expect(userId).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        "No Slack bot token provided, skipping user lookup",
      );
    });
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
    describe("Source Failure Messages", () => {
      const emptyCommit: Commit = {
        id: "",
        author: "",
        summary: "",
        link: "",
      };

      it("should show source failure reason instead of 'Commit details unavailable'", () => {
        const sourceFailure = "The object with key '__no_release_change__/override-required' does not exist.";

        const message = slack.createPipeFailureMessage(
          "my-service [stg]",
          emptyCommit,
          undefined,
          null,
          sourceFailure,
        );

        const commitBlock = message.blocks.find(
          (b: any) => b.type === "section" && b.text?.text?.startsWith(">"),
        ) as any;
        expect(commitBlock.text.text).toContain("Source failed:");
        expect(commitBlock.text.text).toContain("__no_release_change__/override-required");
        expect(commitBlock.text.text).not.toContain("Commit details unavailable");
      });

      it("should not show 'broke the build' when source failure is present", () => {
        const sourceFailure = "The object with key 'some-key' does not exist.";

        const message = slack.createPipeFailureMessage(
          "my-service [stg]",
          emptyCommit,
          undefined,
          null,
          sourceFailure,
        );

        const blocks = message.blocks.map((b: any) => b.text?.text || "").join(" ");
        expect(blocks).not.toContain("broke the build");
        expect(blocks).toContain("Pipeline Failed.");
      });

      it("should still show 'Commit details unavailable' when no source failure info", () => {
        const message = slack.createPipeFailureMessage(
          "some-pipeline",
          emptyCommit,
          undefined,
          null,
        );

        const commitBlock = message.blocks.find(
          (b: any) => b.type === "section" && b.text?.text?.startsWith(">"),
        ) as any;
        expect(commitBlock.text.text).toContain("Commit details unavailable");
      });
    });

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
        const sectionBlock = message.blocks.find((b: any) => b.type === "section") as any;
        expect(sectionBlock.text.text).toContain("<http://www.github.com|View Approval>");
      });

      it("should omit link when approval link is empty", () => {
        const approvalAttributes: ManualApprovalAttributes = {
          link: "",
          comment: "Please review the build artifacts and approve deployment",
        };

        const message = slack.createManualApprovalMessage("unit-test", approvalAttributes);
        expect(message).toBeDefined();
        const sectionBlock = message.blocks.find((b: any) => b.type === "section") as any;
        expect(sectionBlock.text.text).toBe("Please review the build artifacts and approve deployment");
        expect(sectionBlock.text.text).not.toContain("View Approval");
      });

      it("should mention the user when slackUserId is provided", () => {
        const approvalAttributes: ManualApprovalAttributes = {
          link: "http://www.github.com",
          comment: "Please approve this deployment",
        };

        const message = slack.createManualApprovalMessage("unit-test", approvalAttributes, "U12345ABC");
        const sectionBlock = message.blocks.find((b: any) => b.type === "section") as any;
        expect(sectionBlock.text.text).toBe("<@U12345ABC>\nPlease approve this deployment\n<http://www.github.com|View Approval>");
      });

      it("should not mention when slackUserId is null", () => {
        const approvalAttributes: ManualApprovalAttributes = {
          link: "",
          comment: "Please approve this deployment",
        };

        const message = slack.createManualApprovalMessage("unit-test", approvalAttributes, null);
        const sectionBlock = message.blocks.find((b: any) => b.type === "section") as any;
        expect(sectionBlock.text.text).not.toContain("<@");
      });
    });
  });
});
