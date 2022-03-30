/** Information about the commit that initiated the pipeline.
 * id: The commit it
 * author: The author of the commit.
 * summary: The commit message.
 * link: A link to the website showing details for this commit.
 */
export interface CommitType {
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
type CodePipelineEvent = {
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
    pipeline: string;
    "execution-id": string;
    "execution-trigger"?: {
      "trigger-type": "Webhook";
      "trigger-detail": string;
    };
    state: "STARTED" | "SUCCEEDED" | "FAILED";
    version: 16.0;
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
    pipeline: string;
    "execution-id": string;
    state: "STARTED" | "SUCCEEDED" | "FAILED";
    stage: string;
    version: 16.0;
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
    pipeline: string;
    "execution-id": string;
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
    version: 16.0;
  };
  additionalAttributes: {
    sourceActions?: any[];
    additionalInformation?: string;
  };
};
