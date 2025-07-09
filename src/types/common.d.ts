/** The commit type contains simple commit information that should be available
 * from most git service providers.
 */
export interface Commit {
  /** The commit it */
  id: string;
  /** The author of the commit. */
  author: string;
  /** The author's email address. */
  authorEmail?: string;
  /** The commit message. */
  summary: string;
  /** A link to the GIT provider website where this specific commit can be viewed. */
  link: string;
}

  /** Optional information related to a manual approval request.
   */
export interface ManualApprovalAttributes {
   /** A URL added for additional review before approval. */
  link?: string;
  /** Any comments related to the approval request. */
  comment?: string;
}

/**
 * A log entry is an abstracted form of an AWS Code pipeline event. AWS Code Pipeline events contain a lot of meta data.
 * Furthermore, a each different event type has a slightly different format.
 *
 * The logEntry is a cannonicalised view of the various received Code Pipeline events.
 */
export interface LogEntry {
  /** The id of the event activity. Depending on the type of event received. For a codebuild event this is the build id, for a code deployment event the deployment id. */
  id: string;
  /** The type of event that was received. */
  type: string;
  /** The name of the event. */
  name: string;
  /** A web link where a user can find out more information about the event. e.g. The Code Build logs for a CodeBuild event. */
  link?: string;
  /** Any messages associated with the event. */
  message?: string;
  /** A summry of the cause of the event. e.g. For a code deployment failure this could be the output of a failed script.*/
  summary?: string;
}

/**
 * A generic notification that can be sent by some form of Chat.
 *
 * The various available bots parse RawMessages and Convert them to specific Notification that may contain
 * extra data relevant to the notification.
 *
 * This type should never be used directly. However, any notification should extend / union from this type.
 */
export type Notification = {
  /** The type of notification. Different notification types will contain different properties specific to that type of notification. */
  type: string;
};

/**
 * A raw message that has been extracted from an SNS Event Body. The system will attempt to convert any received message from JSON
 * to an object.
 */
export type RawMessage = {
  /** True if the message body could be converted from JSON to an Object. False: If the body is a string. */
  isJson: boolean;
  /** If the parsed body is a string this is the Subject of the received SNS Event. */
  subject: string;
  /** The body of the received SNS Event. If the received body was a JSON string the body will be a deserialised object. */
  body: string | Record<string, unknown>;
};

/**
 * 'A standard notification that has a subject and a message line.
 */
export type SimpleNotification = {
  type: "SimpleNotification";
  /** The notification subject text. */
  subject: string;
  /** The notification message text. */
  message: string;
};

/**
 * A notification that contains information related to some form of System Alarm or Alert.
 *
 * For example a CloudWatch Alarm could be converted to this type.
 */
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
 * A notification that contains information related to the execution of an AWS Pipeline execution.
 *
 * The term "completed" in the context of this type means that either the
 * entire pipeline was successfull or at least one action in any stage failed.
 */
export type PipelineNotification = Notification & {
  type: "PipelineNotification";
  /**  The name of the pipeline that triggered the notification. */
  name: string;
  /** The commit information that relates to this pipeline execution. */
  commit: Commit;
  /** Indicates if the overall pipeline execution was successfull. */
  successfull: boolean;
  /** Contains information related to the cause of the pipeline failure */
  failureDetail?: PipelineCodeBuildFailure | PipelineCodeDeployFailure;
};

/**
 * A notification that contains information related to a manual approval being required for pipeline execution to resume.
 */
 export type ManualApprovalNotification = Notification & {
  type: "ManualApprovalNotification";
  /**  The name of the pipeline that triggered the notification. */
  name: string;
  /**  Optional information to be reviewed by approvers. */
  approvalAttributes: ManualApprovalAttributes;
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
  /** The AWS Code Deployment ID. */
  id: string;
  /** The summary of the code deployment failure. */
  summary: string;
  /** An array of deployment targets that failed deployment. Where available extra
   * diagnostic information is available that may be usefull for troubleshooting
   * the failed deployment.
   */
  targets: (InstanceDiagnosticType | undefined)[];
};

/**
 * Information related to trouble shooting AWS Code Deploy Issues.
 *
 * See: https://docs.aws.amazon.com/codedeploy/latest/APIReference/API_Diagnostics.html
 */
export interface DiagnosticType {
  /** The associated error code. See link for details. */
  errorCode: string;
  /** The last portion of the diagnostic log. */
  logTail: string;
  /** The message associated with the error. */
  message: string;
  /** The name of the script. */
  scriptName: string;
}

/**
 * Information related to trouble shooting AWS Code Deploy Issues for a specific Instance.
 *
 * See: https://docs.aws.amazon.com/codedeploy/latest/APIReference/API_Diagnostics.html
 */
export interface InstanceDiagnosticType {
  /** The EC2 instance id to which diagnostic information is related. */
  instanceid: string;
  /** Diagnostic information for troubleshooting code deploy issues. */
  diagnostics: DiagnosticType | null;
}
