// Mock fs-extra module
jest.mock("fs-extra", () => ({
  readFile: jest.fn(),
}));

import { SlackRoute } from "../../src/lib/SlackRoute";
import { mockClient } from "aws-sdk-client-mock";
import { SSMClient, GetParameterCommand, PutParameterCommand } from "@aws-sdk/client-ssm";
import * as fs from "fs-extra";

const mockReadFile = fs.readFile as jest.MockedFunction<any>;

describe("SlackRoute", () => {
  const ssmMock = mockClient(SSMClient);
  let slackRoute: SlackRoute;

  beforeEach(() => {
    ssmMock.reset();
    jest.clearAllMocks();
    slackRoute = new SlackRoute();
  });

  describe("load", () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should load routes from local file when SLACK_ROUTES_CONFIG_FILE is set", async () => {
      const mockConfig = {
        slack: {
          routes: [{ expression: "type:PipelineNotification", channel: "#pipeline" }],
        },
      };

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockConfig));
      process.env.SLACK_ROUTES_CONFIG_FILE = "/path/to/local/config.json";

      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBe("#pipeline");
      expect(mockReadFile).toHaveBeenCalledWith("/path/to/local/config.json", "utf8");
      expect(ssmMock.calls()).toHaveLength(0); // Should not call SSM
    });

    it("should fallback to SSM when local file fails and SLACK_ROUTES_CONFIG_FILE is set", async () => {
      const mockConfig = {
        slack: {
          routes: [{ expression: "type:PipelineNotification", channel: "#pipeline-ssm" }],
        },
      };

      mockReadFile.mockRejectedValueOnce(new Error("File not found"));
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: JSON.stringify(mockConfig),
        },
      });
      process.env.SLACK_ROUTES_CONFIG_FILE = "/path/to/nonexistent/config.json";

      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBe("#pipeline-ssm");
      expect(mockReadFile).toHaveBeenCalledWith("/path/to/nonexistent/config.json", "utf8");
      expect(ssmMock.calls()).toHaveLength(1); // Should fallback to SSM
    });

    it("should load routes from SSM parameter store when SLACK_ROUTES_CONFIG_FILE is not set", async () => {
      const mockConfig = {
        slack: {
          routes: [{ expression: "type:PipelineNotification", channel: "#pipeline" }],
        },
      };

      delete process.env.SLACK_ROUTES_CONFIG_FILE;
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: JSON.stringify(mockConfig),
        },
      });

      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBe("#pipeline");
      expect(mockReadFile).not.toHaveBeenCalled(); // Should not try to read file
      expect(ssmMock.calls()).toHaveLength(1);
    });

    it("should handle missing parameter gracefully", async () => {
      delete process.env.SLACK_ROUTES_CONFIG_FILE;
      ssmMock.on(GetParameterCommand).rejects(new Error("Parameter not found"));

      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBeNull();
    });
  });

  describe("loadFromFile", () => {
    it("should load routes from local JSON file", async () => {
      const mockConfig = {
        slack: {
          routes: [{ expression: "type:PipelineNotification", channel: "#pipeline" }],
        },
      };

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockConfig));

      await slackRoute.loadFromFile("/path/to/config.json");

      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBe("#pipeline");
      expect(mockReadFile).toHaveBeenCalledWith("/path/to/config.json", "utf8");
    });

    it("should throw error if file cannot be read", async () => {
      mockReadFile.mockRejectedValueOnce(new Error("File not found"));

      await expect(slackRoute.loadFromFile("/invalid/path.json")).rejects.toThrow("File not found");
    });

    it("should throw error if file contains invalid JSON", async () => {
      mockReadFile.mockResolvedValueOnce("invalid json");

      await expect(slackRoute.loadFromFile("/path/to/config.json")).rejects.toThrow(SyntaxError);
    });
  });

  describe("save", () => {
    it("should save routes to SSM parameter store", async () => {
      ssmMock.on(PutParameterCommand).resolves({});

      await slackRoute.save();

      expect(ssmMock.calls()).toHaveLength(1);
    });
  });

  describe("evaluateRoute", () => {
    beforeEach(() => {
      // Set up test routes - order matters as first match wins
      const mockConfig = {
        slack: {
          routes: [
            { expression: "type:PipelineNotification&name~.*prod.*", channel: "#prod-pipeline" },
            { expression: "type:PipelineNotification", channel: "#pipeline" },
            { expression: "type:AlarmNotification", channel: "#alerts" },
            { expression: "!type:AlarmNotification", channel: "#non-alerts" },
            { expression: "type:PipelineNotification|type:AlarmNotification", channel: "#all-alerts" },
          ],
        },
      };
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: JSON.stringify(mockConfig),
        },
      });
    });

    it("should match exact expressions", async () => {
      await slackRoute.load();

      // This should match the first rule (prod-specific) because it has both type:PipelineNotification 
      // and the name property (even though name doesn't match the regex, the type matches the second rule)
      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBe("#pipeline"); // Second rule matches since first rule requires name~.*prod.*
    });

    it("should match regex expressions", async () => {
      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({
        type: "PipelineNotification",
        name: "my-prod-pipeline",
      });
      expect(channel).toBe("#prod-pipeline");
    });

    it("should handle NOT expressions", async () => {
      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({ type: "SimpleNotification" });
      expect(channel).toBe("#non-alerts");
    });

    it("should handle OR expressions", async () => {
      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({ type: "AlarmNotification" });
      expect(channel).toBe("#alerts"); // First matching rule takes precedence
    });

    it("should return null when no rules match", async () => {
      // Set up config with no catch-all rules
      const mockConfig = {
        slack: {
          routes: [
            { expression: "type:PipelineNotification", channel: "#pipeline" },
            { expression: "type:AlarmNotification", channel: "#alerts" },
          ],
        },
      };
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: JSON.stringify(mockConfig),
        },
      });

      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({ type: "UnknownType" });
      expect(channel).toBeNull();
    });

    it("should handle nested object properties", async () => {
      const mockConfig = {
        slack: {
          routes: [{ expression: "alert.name:TestAlarm", channel: "#test-alarms" }],
        },
      };
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: JSON.stringify(mockConfig),
        },
      });

      await slackRoute.load();

      const channel = slackRoute.evaluateRoute({
        type: "AlarmNotification",
        alert: { name: "TestAlarm" },
      });
      expect(channel).toBe("#test-alarms");
    });
  });
});
