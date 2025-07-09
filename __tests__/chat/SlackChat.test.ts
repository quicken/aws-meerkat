import { SlackChat } from "../../src/chat/SlackChat";
import { PipelineNotification } from "../../src/types/common";
import { Slack } from "../../src/lib/Slack";

// Mock fetch globally
global.fetch = jest.fn();

// Mock the Slack class
jest.mock("../../src/lib/Slack");

describe("SlackChat", () => {
  let slackChat: SlackChat;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockSlack = Slack as jest.MockedClass<typeof Slack>;
  const mockPostMessage = jest.fn();
  const mockCreatePipeFailureMessage = jest.fn();
  const mockCreatePipeSuccessMessage = jest.fn();
  const mockCreateManualApprovalMessage = jest.fn();
  const mockSimpleMessage = jest.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    mockFetch.mockClear();
    mockPostMessage.mockClear();
    mockCreatePipeFailureMessage.mockClear();
    mockCreatePipeSuccessMessage.mockClear();
    mockCreateManualApprovalMessage.mockClear();
    mockSimpleMessage.mockClear();

    // Mock Slack instance methods
    mockSlack.mockImplementation(
      () =>
        ({
          createPipeFailureMessage: mockCreatePipeFailureMessage.mockReturnValue({ text: "test", blocks: [] }),
          createPipeSuccessMessage: mockCreatePipeSuccessMessage.mockReturnValue({ text: "test", blocks: [] }),
          createManualApprovalMessage: mockCreateManualApprovalMessage.mockReturnValue({ text: "test", blocks: [] }),
          simpleMessage: mockSimpleMessage.mockReturnValue({ text: "test", blocks: [] }),
          postMessage: mockPostMessage.mockResolvedValue({}),
          divider: { type: "divider" },
        } as any)
    );

    // Mock environment variables
    process.env = {
      ...originalEnv,
      SLACK_WEBHOOK: "https://hooks.slack.com/test",
      SLACK_BOT_TOKEN: "xoxb-test-token",
    };

    // Create SlackChat instance after setting env vars
    slackChat = new SlackChat();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("User lookup functionality", () => {
    it("should find user by email and add mention to pipeline failure message", async () => {
      // Mock successful user lookup by email
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          user: { id: "U1234567890", name: "john.doe" },
        }),
      } as Response);

      const notification: PipelineNotification = {
        type: "PipelineNotification",
        name: "test-pipeline",
        successfull: false,
        commit: {
          id: "abc123",
          author: "John Doe <john.doe@example.com>",
          authorEmail: "john.doe@example.com",
          summary: "Fix bug",
          link: "https://github.com/repo/commit/abc123",
        },
        failureDetail: undefined,
      };

      await slackChat.sendNotification(notification);

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

      // Verify Slack message was posted
      expect(mockPostMessage).toHaveBeenCalledTimes(1);

      // Verify the failure message was created with the mention
      expect(mockCreatePipeFailureMessage).toHaveBeenCalledWith("<@U1234567890> Code Pipeline:test-pipeline", expect.anything(), undefined);
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

      const notification: PipelineNotification = {
        type: "PipelineNotification",
        name: "test-pipeline",
        successfull: false,
        commit: {
          id: "abc123",
          author: "John Doe <john.doe@example.com>",
          authorEmail: "john.doe@example.com",
          summary: "Fix bug",
          link: "https://github.com/repo/commit/abc123",
        },
        failureDetail: undefined,
      };

      await slackChat.sendNotification(notification);

      // Verify both email and name lookup were called
      expect(mockFetch).toHaveBeenCalledWith("https://slack.com/api/users.lookupByEmail?email=john.doe%40example.com", expect.anything());

      expect(mockFetch).toHaveBeenCalledWith(
        "https://slack.com/api/users.list",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer xoxb-test-token",
          }),
        })
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockPostMessage).toHaveBeenCalledTimes(1);

      // Verify the failure message was created with the mention from name lookup
      expect(mockCreatePipeFailureMessage).toHaveBeenCalledWith("<@U1234567890> Code Pipeline:test-pipeline", expect.anything(), undefined);
    });

    it("should work without SLACK_BOT_TOKEN configured", async () => {
      // Reset environment without SLACK_BOT_TOKEN
      process.env = {
        ...originalEnv,
        SLACK_WEBHOOK: "https://hooks.slack.com/test",
      };
      delete process.env.SLACK_BOT_TOKEN;

      // Create new instance without bot token
      const slackChatNoToken = new SlackChat();

      const notification: PipelineNotification = {
        type: "PipelineNotification",
        name: "test-pipeline",
        successfull: false,
        commit: {
          id: "abc123",
          author: "John Doe <john.doe@example.com>",
          authorEmail: "john.doe@example.com",
          summary: "Fix bug",
          link: "https://github.com/repo/commit/abc123",
        },
        failureDetail: undefined,
      };

      await slackChatNoToken.sendNotification(notification);

      // Should not call user lookup APIs
      expect(mockFetch).not.toHaveBeenCalled();
      // Should still post message
      expect(mockPostMessage).toHaveBeenCalledTimes(1);

      // Verify the failure message was created without mention
      expect(mockCreatePipeFailureMessage).toHaveBeenCalledWith("Code Pipeline:test-pipeline", expect.anything(), undefined);
    });
  });
});
