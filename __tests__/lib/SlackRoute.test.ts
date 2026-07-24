import { SlackRoute } from "../../src/lib/SlackRoute";

describe("SlackRoute", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("evaluateRoute", () => {
    it("should match exact expressions", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification&name~.*prod.*", channel: "#prod-pipeline" },
        { expression: "type:PipelineNotification", channel: "#pipeline" },
      ]);

      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBe("#pipeline");
    });

    it("should match regex expressions", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification&name~.*prod.*", channel: "#prod-pipeline" },
        { expression: "type:PipelineNotification", channel: "#pipeline" },
      ]);

      const channel = slackRoute.evaluateRoute({
        type: "PipelineNotification",
        name: "my-prod-pipeline",
      });
      expect(channel).toBe("#prod-pipeline");
    });

    it("should handle NOT expressions", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification", channel: "#pipeline" },
        { expression: "!type:AlarmNotification", channel: "#non-alerts" },
      ]);

      const channel = slackRoute.evaluateRoute({ type: "SimpleNotification" });
      expect(channel).toBe("#non-alerts");
    });

    it("should handle OR expressions", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification|type:AlarmNotification", channel: "#all" },
      ]);

      const channel = slackRoute.evaluateRoute({ type: "AlarmNotification" });
      expect(channel).toBe("#all");
    });

    it("should return null when no rules match", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification", channel: "#pipeline" },
      ]);

      const channel = slackRoute.evaluateRoute({ type: "UnknownType" });
      expect(channel).toBeNull();
    });

    it("should handle nested object properties", () => {
      const slackRoute = new SlackRoute([
        { expression: "alert.name:TestAlarm", channel: "#test-alarms" },
      ]);

      const channel = slackRoute.evaluateRoute({
        type: "AlarmNotification",
        alert: { name: "TestAlarm" },
      });
      expect(channel).toBe("#test-alarms");
    });

    it("should match on account field", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification&account:111111111111", channel: "#dev" },
        { expression: "type:PipelineNotification&account:222222222222", channel: "#prod" },
      ]);

      const channel = slackRoute.evaluateRoute({
        type: "PipelineNotification",
        account: "222222222222",
        name: "my-pipeline",
      });
      expect(channel).toBe("#prod");
    });

    it("should route alarms by account", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:AlarmNotification&account:333333333333", channel: "#prod-alerts" },
        { expression: "type:AlarmNotification", channel: "#general-alerts" },
      ]);

      const channel = slackRoute.evaluateRoute({
        type: "AlarmNotification",
        account: "333333333333",
        alert: { name: "HighCPU", type: "alarm" },
      });
      expect(channel).toBe("#prod-alerts");
    });

    it("should fall through when account does not match", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification&account:333333333333", channel: "#prod" },
        { expression: "type:PipelineNotification", channel: "#general" },
      ]);

      const channel = slackRoute.evaluateRoute({
        type: "PipelineNotification",
        account: "111111111111",
        name: "dev-pipeline",
      });
      expect(channel).toBe("#general");
    });

    it("should combine account with other conditions", () => {
      const slackRoute = new SlackRoute([
        { expression: "type:PipelineNotification&account:333333333333&successfull:false", channel: "#prod-failures" },
        { expression: "type:PipelineNotification&account:333333333333", channel: "#prod-deployments" },
      ]);

      const failed = slackRoute.evaluateRoute({
        type: "PipelineNotification",
        account: "333333333333",
        name: "prod-pipeline",
        successfull: "false",
      });
      expect(failed).toBe("#prod-failures");

      const succeeded = slackRoute.evaluateRoute({
        type: "PipelineNotification",
        account: "333333333333",
        name: "prod-pipeline",
        successfull: "true",
      });
      expect(succeeded).toBe("#prod-deployments");
    });

    it("should log and return null for invalid regex expressions", () => {
      const slackRoute = new SlackRoute([
        { expression: "name~[invalid(", channel: "#bad" },
      ]);

      const channel = slackRoute.evaluateRoute({ name: "test" });
      expect(channel).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        "Invalid regex in route expression:",
        expect.any(Error),
      );
    });

    it("should return null when no routes are configured", () => {
      const slackRoute = new SlackRoute([]);

      const channel = slackRoute.evaluateRoute({ type: "PipelineNotification" });
      expect(channel).toBeNull();
    });
  });
});
