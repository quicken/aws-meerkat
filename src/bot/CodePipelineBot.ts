import { Bot } from "./Bot";
import {
  PipelineNotification,
  LogEntry,
  PipelineCodeBuildFailure,
  PipelineCodeDeployFailure,
  RawMessage,
} from "../types";
import {
  CodePipelineEvent,
  CodePipelineExecutionEvent,
  CodePipelineActionEvent,
} from "../types/AwsCodePipeline";
import { PipeLog } from "../lib/PipeLog";
import { CodeBuild } from "../lib/CodeBuild";
import { CodeDeploy } from "../lib/CodeDeploy";

type CodePipelineEventType =
  | "CodePipelineExecutionEvent"
  | "CodePipelineStageEvent"
  | "CodePipelineActionEvent"
  | "";

export class CodePipelineBot extends Bot {
  pipeLog: PipeLog;
  codeBuild: CodeBuild;
  codeDeploy: CodeDeploy;

  constructor(pipeLog: PipeLog, codeBuild: CodeBuild, codeDeploy: CodeDeploy) {
    super();
    this.pipeLog = pipeLog;
    this.codeBuild = codeBuild;
    this.codeDeploy = codeDeploy;
  }

  /**
   * Detects the type of AWS Code Pipeline Event that was received. If the
   * passed in object can not be mapped to an known pipeline event the function
   * returns an empty string.
   * @param event An object to which detection should be applied.
   * @returns The detected event type.
   */
  static detectEventType = (
    event: Record<string, unknown>
  ): CodePipelineEventType => {
    let type: CodePipelineEventType = "";
    if (event.detailType) {
      switch (event.detailType) {
        case "CodePipeline Pipeline Execution State Change":
          type = "CodePipelineExecutionEvent";
          break;
        case "CodePipeline Stage Execution State Change":
          type = "CodePipelineStageEvent";
          break;
        case "CodePipeline Action Execution State Change":
          type = "CodePipelineActionEvent";
          break;
      }
    }

    return type;
  };

  handleMessage = async (
    rawMessage: RawMessage
  ): Promise<PipelineNotification | null> => {
    const codePipelineEvent = rawMessage.body as CodePipelineEvent;
    const eventType = CodePipelineBot.detectEventType(codePipelineEvent);

    switch (eventType) {
      case "CodePipelineExecutionEvent":
        return this.handleExecutionEvent(
          codePipelineEvent as CodePipelineExecutionEvent
        );
      case "CodePipelineStageEvent":
        break;
      case "CodePipelineActionEvent":
        return this.handleActionEvent(
          codePipelineEvent as CodePipelineActionEvent
        );
    }
    return null;
  };

  private handleExecutionEvent = async (event: CodePipelineExecutionEvent) => {
    if (event.detail.state !== "SUCCEEDED") return null;
    return this.createPipelineNotification(this.pipeLog);
  };

  private handleActionEvent = async (event: CodePipelineActionEvent) => {
    await this.pipeLog.handlePipelineAction(event);
    if (!this.pipeLog.isFailed) {
      return null;
    }

    return this.createPipelineNotification(this.pipeLog);
  };

  createPipelineNotification = async (pipelog: PipeLog) => {
    const notification: PipelineNotification = {
      type: "PipelineNotification",
      name: pipelog.name,
      commit: pipelog.commit,
      successfull: !pipelog.isFailed,
    };

    if (pipelog.isFailed && pipelog.failed) {
      const logEntry = { ...pipelog.failed };
      if (logEntry.type === "build") {
        notification.failureDetail = await this.fetchCodeBuildInfo(logEntry);
      } else if (logEntry.type === "deploy") {
        notification.failureDetail = await this.fetchCodeDeployInfo(logEntry);
      }
    }

    return notification;
  };

  private fetchCodeBuildInfo = async (
    logEntry: LogEntry
  ): Promise<PipelineCodeBuildFailure> => {
    return {
      type: "CodeBuild",
      logUrl: await this.codeBuild.fetchBuildLogUrl(logEntry.id),
    };
  };

  private fetchCodeDeployInfo = async (
    logEntry: LogEntry
  ): Promise<PipelineCodeDeployFailure> => {
    return {
      type: "CodeDeploy",
      id: logEntry.id,
      summary: logEntry.summary ? logEntry.summary : "",
      targets: await this.codeDeploy.deployDetails(logEntry.id),
    };
  };

  /**
   * Record that a notification has been sent for the active pipelog.
   */
  notificationSent = async () => {
    this.pipeLog.isNotified = true;
    this.pipeLog.save();
  };

  /**
   * Provides a mechanism to use the pipeline name and a naming convention for
   * environment variables to control the ARN that should
   * be used when calling the CODE Deploy SDK.
   *
   * The pattern is DEPLOY_ARN_{searchterm}
   *
   * If the variable DEPLOY_ARN is undefined or the search does not match a
   * empty string is returned.
   *
   * If DEPLOY_ARN is defined it will be used when the search does not match.
   *
   * The sub string for the search is embedded into the environment variable name. For
   * example to specify the ARN for any pipe line with the word production in the name
   * create and environment variable named: DEPLOY_ARN_production. The match is case
   * insenstive.
   *
   * @param name  The name of the code pipeline.
   * @param env The process.env object or a similar object.
   * @returns The ARN of the role that is assumed when calling the AWS Deploy SDK.
   */
  static getDeployArnFromEnv = (name: string, env: any): string => {
    const defaultArn = env.DEPLOY_ARN ? env.DEPLOY_ARN : "";
    for (const key in env) {
      if (key.startsWith("DEPLOY_ARN")) {
        const searchTerm = key.split("_").slice(2).join("_").toLowerCase();
        if (searchTerm && name.toLowerCase().includes(searchTerm)) {
          return env[key];
        }
      }
    }
    return defaultArn;
  };
}
