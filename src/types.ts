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

export interface LogEntry {
  id: string;
  type: string;
  name: string;
  link?: string;
  message?: string;
  summary?: string;
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
