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
