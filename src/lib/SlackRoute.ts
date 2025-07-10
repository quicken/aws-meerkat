import { SSMClient, GetParameterCommand, PutParameterCommand } from "@aws-sdk/client-ssm";
import * as fs from "fs-extra";

/**
 * Represents a single routing rule with an expression and target channel
 * @example
 * {
 *   expression: "type:PipelineNotification&name~.*prod.*",
 *   channel: "#prod-pipeline"
 * }
 */
export interface SlackRouteRule {
  /**
   * The routing expression to evaluate
   * @see {@link SlackRoute.evaluateExpression} for expression syntax
   */
  expression: string;
  /**
   * The Slack channel to route to if expression matches
   */
  channel: string;
}

/**
 * Configuration structure for Slack routing rules
 * @example
 * {
 *   slack: {
 *     routes: [
 *       { expression: "type:PipelineNotification", channel: "#pipeline" },
 *       { expression: "type:AlarmNotification", channel: "#alerts" },
 *       { expression: "type:PipelineNotification&name~.*prod.*", channel: "#prod-pipeline" }
 *     ]
 *   }
 * }
 */
export interface SlackRouteConfig {
  slack: {
    routes: SlackRouteRule[];
  };
}

/**
 * Handles routing of messages to Slack channels based on configurable rules
 *
 * The SlackRoute class supports loading routing configuration from either:
 * 1. AWS Systems Manager Parameter Store (for production use)
 * 2. Local JSON file (for development/testing)
 *
 * Routing rules are evaluated in order and the first matching rule determines
 * the target channel.
 *
 * @example
 * ```typescript
 * // Load from SSM Parameter Store
 * const router = new SlackRoute("/my/param/path");
 * await router.load();
 *
 * // Or load from local file
 * const router = new SlackRoute();
 * await router.loadFromFile("./config.json");
 *
 * // Evaluate a message
 * const channel = router.evaluateRoute({
 *   type: "PipelineNotification",
 *   name: "my-prod-pipeline"
 * });
 * ```
 */
export class SlackRoute {
  private ssmClient: SSMClient;
  private parameterName: string;
  private config: SlackRouteConfig;

  constructor(parameterName: string = "/meerkat/slack/routes") {
    this.ssmClient = new SSMClient({});
    this.parameterName = parameterName;
    this.config = {
      slack: {
        routes: [],
      },
    };
  }

  /**
   * Load routing configuration from either local file (if SLACK_ROUTES_CONFIG_FILE is set)
   * or SSM Parameter Store
   */
  public async load(): Promise<void> {
    const configFilePath = process.env.SLACK_ROUTES_CONFIG_FILE;

    // If development config file path is specified, load from file system
    if (configFilePath) {
      try {
        console.log(`Loading Slack routes from local file: ${configFilePath}`);
        await this.loadFromFile(configFilePath);
        return;
      } catch (error) {
        console.log(`Failed to load slack routes from file ${configFilePath}:`, error);
        console.log("Falling back to AWS Parameter Store...");
        // Continue to AWS Parameter Store fallback
      }
    }

    // Default behavior: load from AWS Parameter Store
    try {
      const command = new GetParameterCommand({
        Name: this.parameterName,
      });
      const response = await this.ssmClient.send(command);

      if (response.Parameter?.Value) {
        this.config = JSON.parse(response.Parameter.Value);
      }
    } catch (error) {
      console.log("Failed to load slack routes from AWS Parameter Store:", error);
      // If parameter doesn't exist, we'll use empty default config
      console.log("Using default empty routing configuration");
    }
  }

  /**
   * Save current routing configuration to SSM Parameter Store
   */
  public async save(): Promise<void> {
    try {
      const command = new PutParameterCommand({
        Name: this.parameterName,
        Value: JSON.stringify(this.config),
        Type: "String",
        Overwrite: true,
      });
      await this.ssmClient.send(command);
    } catch (error) {
      console.log("Failed to save slack routes:", error);
      throw error;
    }
  }

  /**
   * Evaluate a message against routing rules to determine target channel
   */
  public evaluateRoute(message: any): string | null {
    for (const rule of this.config.slack.routes) {
      if (this.evaluateExpression(rule.expression, message)) {
        return rule.channel;
      }
    }
    return null;
  }

  /**
   * Load routing configuration from a local JSON file
   * @param filePath Path to the JSON configuration file
   * @throws {Error} If file cannot be read or parsed
   * @example
   * ```typescript
   * await router.loadFromFile("./config/routes.json");
   * ```
   */
  public async loadFromFile(filePath: string): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      this.config = JSON.parse(fileContent);
    } catch (error) {
      console.error("Failed to load slack routes from file:", error);
      throw error;
    }
  }

  /**
   * Evaluate a single routing expression against a message
   *
   * Expression syntax supports the following operators:
   * - `:` for exact value match (e.g., `type:PipelineNotification`)
   * - `~` for regex match (e.g., `name~.*prod.*`)
   * - `!` for NOT (e.g., `!type:AlarmNotification`)
   * - `&` for AND (e.g., `type:Pipeline&status:FAILED`)
   * - `|` for OR (e.g., `type:Pipeline|type:Deployment`)
   *
   * Expressions can reference nested properties using dot notation (e.g., `alert.severity:HIGH`)
   *
   * @example
   * Simple property match:
   * ```
   * type:PipelineNotification
   * ```
   *
   * @example
   * Regex match with AND condition:
   * ```
   * type:PipelineNotification&name~.*prod.*
   * ```
   *
   * @example
   * NOT condition:
   * ```
   * !type:AlarmNotification
   * ```
   *
   * @example
   * OR condition:
   * ```
   * type:PipelineNotification|type:AlarmNotification
   * ```
   *
   * @example
   * Nested property with multiple conditions:
   * ```
   * type:AlarmNotification&alert.severity:HIGH&alert.status~FAIL.*
   * ```
   */
  private evaluateExpression(expression: string, message: any): boolean {
    // Handle OR conditions
    if (expression.includes("|")) {
      const parts = expression.split("|");
      return parts.some((part) => this.evaluateExpression(part.trim(), message));
    }

    // Handle AND conditions
    if (expression.includes("&")) {
      const parts = expression.split("&");
      return parts.every((part) => {
        const result = this.evaluateExpression(part.trim(), message);
        return result;
      });
    }

    // Handle NOT conditions
    if (expression.startsWith("!")) {
      return !this.evaluateExpression(expression.slice(1).trim(), message);
    }

    // Handle basic property:value or property~regex expressions
    const [property, matcher] = expression.split(/[:|~]/);
    if (!property || !matcher) return false;

    const value = this.getPropertyValue(property.trim(), message);
    if (value === undefined) return false;

    // Handle regex match
    if (expression.includes("~")) {
      try {
        const regex = new RegExp(matcher.trim());
        return regex.test(String(value));
      } catch (e) {
        console.log("Invalid regex in route expression:", e);
        return false;
      }
    }

    // Handle exact match
    return String(value) === matcher.trim();
  }

  /**
   * Get a property value from an object using dot notation
   */
  private getPropertyValue(property: string, obj: any): any {
    return property.split(".").reduce((o, i) => o?.[i], obj);
  }
}