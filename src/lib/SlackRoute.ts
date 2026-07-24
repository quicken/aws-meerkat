import { SlackRouteRule } from "./MeerkatConfig";

export { SlackRouteRule };

/**
 * Handles routing of messages to Slack channels based on configurable rules.
 *
 * Rules are evaluated in order and the first matching rule determines the target channel.
 */
export class SlackRoute {
  private readonly routes: SlackRouteRule[];

  constructor(routes: SlackRouteRule[]) {
    this.routes = routes;
  }

  /**
   * Evaluate a message against routing rules to determine target channel
   */
  public evaluateRoute(message: any): string | null {
    for (const rule of this.routes) {
      if (this.evaluateExpression(rule.expression, message)) {
        return rule.channel;
      }
    }
    return null;
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
      return parts.some((part) =>
        this.evaluateExpression(part.trim(), message),
      );
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
