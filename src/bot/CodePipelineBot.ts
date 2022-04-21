import { Bot } from "./Bot";
import {
  PipelineNotification,
  LogEntry,
  PipelineCodeBuildFailure,
  PipelineCodeDeployFailure,
  RawMessage,
  ManualApprovalNotification,
} from "../types/common";
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
  ): Promise<PipelineNotification | ManualApprovalNotification | null> => {
    const codePipelineEvent = rawMessage.body as CodePipelineEvent;
    const eventType = CodePipelineBot.detectEventType(codePipelineEvent);

    await this.pipeLog.load(codePipelineEvent.detail["execution-id"]);

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

  /**
   * Sends notifications when an entire pipeline execution has either succeeded or
   * failed. However, due to fact that events can be processed out of order this method
   * does NOT send our notifications if the source stage contains the word "build".
   *
   * In those cases we rely on the action event to send the notification.
   *
   * This is a workaround for the following scenario. If all failure notifications
   * are based on a failed pipeline action event then a code deploy failure will send
   * one notification for each autodeployment group which spams discord. Alternatively if
   * we use the pipeline execution event then due to a race condition the code build notification
   * never includes any metat data since the action event sometimes runs after the pipeline execution event.
   *
   * This could also be because of the time it takes the action handle to retrieve meta data. As such it may
   * be the case that the action event is still fetching data by the time the execution event is fired.
   *
   * For the same reason a "sent" notification is not effective in preventing multiple messages from being sent.
   *
   * Another option worth exploring is to implement a "sleep" function so that a failed pipeline execution event handlder
   * tries to give the action events enough time to write data before the execution event then loads the pipelog.
   *
   * Either way they are all shitty options..
   *
   * @param event
   * @returns
   */
  private handleExecutionEvent = async (event: CodePipelineExecutionEvent) => {
    switch (event.detail.state) {
      case "SUCCEEDED":
        return this.createSuccessNotification(this.pipeLog);
      case "FAILED": {
        if (
          event.additionalAttributes.failedStage &&
          event.additionalAttributes.failedStage.toLowerCase().includes("build")
        ) {
          return null;
        } else {
          return this.createFailureNotification(this.pipeLog);
        }
      }
    }

    return null;
  };

  /**
   * Please see the notes for the handleExecutionEvent
   * @param event
   * @returns
   */
  private handleActionEvent = async (event: CodePipelineActionEvent) => {
    await this.pipeLog.handlePipelineAction(event);
    if (
      event.detail.type.provider === "CodeBuild" &&
      event.detail.state === "FAILED"
    ) {
      return this.createFailureNotification(this.pipeLog);
    }
    if (
      event.detail.type.provider === "Manual" &&
      event.detail.state === "STARTED") {
      return this.createManualApprovalNotification(this.pipeLog);
    }
    return null;
  };

  createManualApprovalNotification = async (
    pipelog: PipeLog
  ): Promise<ManualApprovalNotification> => ({
    type: "ManualApprovalNotification",
    name: pipelog.name,
    approvalAttributes: pipelog.approvalAttributes
  });

  createSuccessNotification = async (
    pipelog: PipeLog
  ): Promise<PipelineNotification> => ({
    type: "PipelineNotification",
    name: pipelog.name,
    commit: pipelog.commit,
    successfull: true,
  });

  createFailureNotification = async (
    pipelog: PipeLog
  ): Promise<PipelineNotification> => {
    const notification: PipelineNotification = {
      type: "PipelineNotification",
      name: pipelog.name,
      commit: pipelog.commit,
      successfull: false,
    };

    if (pipelog.failed) {
      const logEntry = { ...pipelog.failed };
      if (logEntry.type === "build") {
        notification.failureDetail = await this.fetchCodeBuildInfo(logEntry.id);
      } else if (logEntry.type === "deploy") {
        notification.failureDetail = await this.fetchCodeDeployInfo(logEntry);
      }
    }

    return notification;
  };

  private fetchCodeBuildInfo = async (
    buildId: string
  ): Promise<PipelineCodeBuildFailure> => {
    return {
      type: "CodeBuild",
      logUrl: await this.codeBuild.fetchBuildLogUrl(buildId),
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
