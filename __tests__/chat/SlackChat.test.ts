import { SlackChat } from "../../src/chat/SlackChat";
import {
  PipelineNotification,
  SimpleNotification,
  AlarmNotification,
  ManualApprovalNotification,
  PipelineCodeBuildFailure,
  Commit
} from "../../src/types/common";
import { Slack } from "../../src/lib/Slack";
import { SlackRoute } from "../../src/lib/SlackRoute";

// Mock fetch globally
global.fetch = jest.fn();

// Mock the Slack class and SlackRoute class
jest.mock("../../src/lib/Slack");
jest.mock("../../src/lib/SlackRoute");

describe("SlackChat", () => {
  let slackChat: SlackChat;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockSlack = Slack as jest.MockedClass<typeof Slack>;
  const mockSlackRoute = SlackRoute as jest.MockedClass<typeof SlackRoute>;
  const mockPostMessage = jest.fn();
  const mockCreatePipeFailureMessage = jest.fn();
  const mockCreatePipeSuccessMessage = jest.fn();
  const mockCreateManualApprovalMessage = jest.fn();
  const mockSimpleMessage = jest.fn();
  const mockFindSlackUserId = jest.fn();
  const mockEvaluateRoute = jest.fn();
  const mockLoadRoute = jest.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    mockFetch.mockClear();
    mockPostMessage.mockClear();
    mockCreatePipeFailureMessage.mockClear();
    mockCreatePipeSuccessMessage.mockClear();
    mockCreateManualApprovalMessage.mockClear();
    mockSimpleMessage.mockClear();
    mockFindSlackUserId.mockClear();
    mockEvaluateRoute.mockClear();
    mockLoadRoute.mockClear();

    // Mock Slack instance methods
    mockSlack.mockImplementation(
      () =>
        ({
          createPipeFailureMessage: mockCreatePipeFailureMessage.mockReturnValue({ text: "test", blocks: [] }),
          createPipeSuccessMessage: mockCreatePipeSuccessMessage.mockReturnValue({ text: "test", blocks: [] }),
          createManualApprovalMessage: mockCreateManualApprovalMessage.mockReturnValue({ text: "test", blocks: [] }),
          simpleMessage: mockSimpleMessage.mockReturnValue({ text: "test", blocks: [] }),
          postMessageToChannel: mockPostMessage.mockResolvedValue({}),
          findSlackUserId: mockFindSlackUserId.mockResolvedValue("U1234567890"),
          divider: { type: "divider" },
        } as any)
    );

    // Mock SlackRoute instance methods
    mockSlackRoute.mockImplementation(
      () =>
        ({
          load: mockLoadRoute.mockResolvedValue(undefined),
          evaluateRoute: mockEvaluateRoute.mockReturnValue(null),
        } as any)
    );

    // Mock environment variables
    process.env = {
      ...originalEnv,
      SLACK_WEBHOOK: "https://hooks.slack.com/test",
      SLACK_BOT_TOKEN: "xoxb-test-token",
      SLACK_CHANNEL: "test-channel"
    };

    // Create SlackChat instance after setting env vars
    slackChat = new SlackChat();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Simple Notifications", () => {
    it("should send a simple notification", async () => {
      const notification: SimpleNotification = {
        type: "SimpleNotification",
        subject: "Test Subject",
        message: "Test Message"
      };

      await slackChat.sendNotification(notification);

      expect(mockSimpleMessage).toHaveBeenCalledWith("Test Subject", "Test Message");
      expect(mockPostMessage).toHaveBeenCalledWith(
        { text: "test", blocks: [] },
        "test-channel"
      );
    });
  });

  describe("Alarm Notifications", () => {
    it("should send an alarm notification", async () => {
      const notification: AlarmNotification = {
        type: "AlarmNotification",
        alert: {
          type: "alarm",
          name: "TestAlarm",
          description: "High CPU Usage Alert",
          reason: "High CPU Usage",
          date: Date.now()
        }
      };

      await slackChat.sendNotification(notification);

      expect(mockSimpleMessage).toHaveBeenCalledWith("Cloudwatch Alarm:TestAlarm", "High CPU Usage");
      expect(mockPostMessage).toHaveBeenCalledWith(
        { text: "test", blocks: [] },
        "test-channel"
      );
    });
  });

  describe("Pipeline Notifications", () => {
    const baseCommit: Commit = {
      id: "123456",
      author: "John Doe",
      authorEmail: "john.doe@example.com",
      summary: "Test commit",
      link: "http://github.com/test"
    };

    it("should send a successful pipeline notification", async () => {
      const notification: PipelineNotification = {
        type: "PipelineNotification",
        name: "TestPipeline",
        successfull: true,
        commit: baseCommit
      };

      await slackChat.sendNotification(notification);

      expect(mockFindSlackUserId).toHaveBeenCalledWith("john.doe@example.com", "John Doe");
      expect(mockCreatePipeSuccessMessage).toHaveBeenCalledWith(
        "Code Pipeline:TestPipeline",
        baseCommit,
        "U1234567890"
      );
      expect(mockPostMessage).toHaveBeenCalledWith(
        { text: "test", blocks: [] },
        "test-channel"
      );
    });

    it("should send a failed pipeline notification", async () => {
      const failureDetail: PipelineCodeBuildFailure = {
        type: "CodeBuild",
        logUrl: "http://example.com/logs"
      };

      const notification: PipelineNotification = {
        type: "PipelineNotification",
        name: "TestPipeline",
        successfull: false,
        commit: baseCommit,
        failureDetail
      };

      await slackChat.sendNotification(notification);

      expect(mockFindSlackUserId).toHaveBeenCalledWith("john.doe@example.com", "John Doe");
      expect(mockCreatePipeFailureMessage).toHaveBeenCalledWith(
        "Code Pipeline:TestPipeline",
        baseCommit,
        failureDetail,
        "U1234567890"
      );
      expect(mockPostMessage).toHaveBeenCalledWith(
        { text: "test", blocks: [] },
        "test-channel"
      );
    });
  });

  describe("Manual Approval Notifications", () => {
    it("should send a manual approval notification", async () => {
      const notification: ManualApprovalNotification = {
        type: "ManualApprovalNotification",
        name: "TestApproval",
        approvalAttributes: {
          link: "http://example.com/approve",
          comment: "Please approve this deployment"
        }
      };

      await slackChat.sendNotification(notification);

      expect(mockCreateManualApprovalMessage).toHaveBeenCalledWith(
        "TestApproval",
        notification.approvalAttributes
      );
      expect(mockPostMessage).toHaveBeenCalledWith(
        { text: "test", blocks: [] },
        "test-channel"
      );
    });
  });

  describe("Message Routing", () => {
    it("should load routes on initialization", () => {
      expect(mockLoadRoute).toHaveBeenCalled();
    });

    it("should use routed channel when available", async () => {
      mockEvaluateRoute.mockReturnValue("#routed-channel");

      const notification: SimpleNotification = {
        type: "SimpleNotification",
        subject: "Test Subject",
        message: "Test Message"
      };

      await slackChat.sendNotification(notification);

      expect(mockEvaluateRoute).toHaveBeenCalledWith(notification);
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.anything(),
        "#routed-channel"
      );
    });

    it("should fallback to default channel when no route matches", async () => {
      mockEvaluateRoute.mockReturnValue(null);

      const notification: SimpleNotification = {
        type: "SimpleNotification",
        subject: "Test Subject",
        message: "Test Message"
      };

      await slackChat.sendNotification(notification);

      expect(mockEvaluateRoute).toHaveBeenCalledWith(notification);
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.anything(),
        "test-channel"
      );
    });

    it("should handle routing errors gracefully", async () => {
      mockEvaluateRoute.mockImplementation(() => {
        throw new Error("Routing error");
      });

      const notification: SimpleNotification = {
        type: "SimpleNotification",
        subject: "Test Subject",
        message: "Test Message"
      };

      // The current implementation now handles routing errors gracefully
      // and continues with the default channel
      await slackChat.sendNotification(notification);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.anything(),
        "test-channel"
      );
    });
  });
});
