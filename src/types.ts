/** Information about the commit that initiated the pipeline.
 * id: The commit it
 * author: The author of the commit.
 * summary: The commit message.
 * link: A link to the website showing details for this commit.
 */
export interface Commit {
  id: string;
  author: string;
  summary: string;
  link: string;
}

export interface LogEntryType {
  id: string;
  type: string;
  name: string;
  link?: string;
  message?: string;
  summary?: string;
}

export interface BuildLogEntryType extends LogEntryType {
  build: {
    logUrl: string;
  };
}

export interface DeployLogEntryType extends LogEntryType {
  deploy: {
    targets: InstanceDiagnosticType[];
  };
}

/** Extra information for troubleshooting pipeline failures caused by AWS Code Build. */
export type PipelineCodeBuildFailure = {
  type: "CodeBuild";
  /** The URL that shows the code build logs for this build within the AWS Web Console. */
  logUrl: string;
};

/** Extra information for troubleshooting pipeline failures caused by AWS Code Deploy. */
export type PipelineCodeDeployFailure = {
  type: "CodeDeploy";
  id: string;
  summary: string;
  targets: (InstanceDiagnosticType | undefined)[];
};

export type Notification = {
  type: string;
};

export type RawMessage = {
  isJson: boolean;
  subject: string;
  body: string | Record<string, unknown>;
};

export type SimpleNotification = {
  type: "SimpleNotification";
  subject: string;
  message: string;
};

export type AlarmNotification = Notification & {
  type: "AlarmNotification";
  alert: {
    /** The type of alert that is being raised. */
    type: "alarm" | "nag" | "recovered" | "healthy";
    /**  The name of the pipeline. */
    name: string;
    /** The Alarm description. */
    description: string;
    /** Extra information why the alarm / alert was raised. */
    reason: any;
    /** The time stamp form the alert transition into the current state. */
    date: number;
  };
};

/**
 * The pipeline notification is available after the pipeline execution has been completed.
 *
 * The term "completed" in the context of this type means that either the
 * entire pipeline was successfull or at least one action in any stage failed.
 */
export type PipelineNotification = Notification & {
  type: "PipelineNotification";
  /**  The name of the pipeline. */
  name: string;
  /** The commit that triggered the pipeline execution. */
  commit: Commit;
  /** Indicates if the overall pipeline execution was successfull. */
  successfull: boolean;
  /** Contains information related to the cause of the pipeline failure */
  failureDetail?: PipelineCodeBuildFailure | PipelineCodeDeployFailure;
};

export interface DiagnosticType {
  errorCode: string;
  logTail: string;
  message: string;
  scriptName: string;
}

export interface InstanceDiagnosticType {
  instanceid: string;
  diagnostics: DiagnosticType | null;
}

export interface AlarmType {
  name: string;
  description: string;
  reason: string;
  date: number;
  type: "alarm" | "nag" | "recovered" | "healthy";
}

/**
 * The CodePipelineEvent describes the properties available by all events that are generated during the life-cycle of
 * a code pipeline execution.
 *
 * https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
 */
export type CodePipelineEvent = {
  detail: {
    pipeline: string;
    "execution-id": string;
    version: 16.0;
  };
  account: string;
  region: string;
  source: string;
  time: string;
  notificationRuleArn: string;
  resources: string[];
};

/**
 * https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
 */
export type CodePipelineExecutionEvent = CodePipelineEvent & {
  detailType: "CodePipeline Pipeline Execution State Change";
  detail: {
    "execution-trigger"?: {
      "trigger-type": "Webhook";
      "trigger-detail": string;
    };
    state: "STARTED" | "SUCCEEDED" | "FAILED";
  };
  additionalAttributes: {
    sourceActions?: any[];
    failedActionCount?: number;
    failedActions?: CodePipelineFailedAction[];
    failedStage?: string;
  };
};

type CodePipelineFailedAction = {
  action: string;
  additionalInformation: string;
};

/**
 * https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
 */
export type CodePipelineStageEvent = CodePipelineEvent & {
  detailType: "CodePipeline Stage Execution State Change";
  detail: {
    state: "STARTED" | "SUCCEEDED" | "FAILED";
    stage: string;
  };
  additionalAttributes: {
    sourceActions?: any[];
    failedActionCount?: number;
    failedActions?: CodePipelineFailedAction[];
  };
};

type CodePipelineActionType = {
  owner: "AWS";
  provider: string;
  category: string;
  version: "1";
};

type CodePipeLineArtifact = {
  name: string;
  s3location: {
    bucket: string;
    key: string;
  };
};

/**
 * https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
 */
export type CodePipelineActionEvent = CodePipelineEvent & {
  detailType: "CodePipeline Action Execution State Change";
  detail: {
    "execution-result"?: {
      "external-execution-url": string;
      "external-execution-id": string;
      "external-execution-summary"?: string;
      "error-code"?: string;
    };
    "input-artifacts"?: CodePipeLineArtifact[];
    "output-artifacts"?: CodePipeLineArtifact[];
    state: "STARTED" | "SUCCEEDED" | "FAILED";
    action: "Source" | "Build" | string;
    stage: string;
    region: string;
    type: CodePipelineActionType;
  };
  additionalAttributes: {
    sourceActions?: any[];
    additionalInformation?: string;
  };
};
