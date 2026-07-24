import { URL } from "node:url";
import { BitBucket } from "./BitBucket";
import { GitHub } from "./GitHub";
import { CodePipeline } from "./CodePipeline";
import { ManualApprovalAttributes, Commit, LogEntry } from "../types/common";
import { CodePipelineActionEvent } from "../types/AwsCodePipeline";

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  PutItemCommandOutput,
} from "@aws-sdk/client-dynamodb";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * A class which logs the events triggered by an AWS Code Pipeline execution to a single dynamo DB record.
 *
 * Events received from a AWS Codepipeline Notification do not contain the full information about the cause of a pipeline execution failure.
 *
 * The pipelog contains a set of events of interest that have been captured from a specific pipelog execution. Each event
 * is enriched by querying external services. For example a "commit" event reaches out a Bitbucket or GitHub to fetch
 * extra information of interest related to the commit. Or, a "Code Deploy" failed event is enriched by querying the
 * Code Deploy service for diagnostic information.
 *
 * For example: The only time a commit id is available is when the checkout action returns SUCESS. However,
 * the commit author must then be retrieved from bitbucket. The retrieved information is then persisted to
 * the database. The next message for the current execution can then retrieve the previously retrived commit
 * information by loading the pipelog from the database.
 *
 * https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
 */
export class PipeLog {
  /** The execution id identifies notifications which belong together. */
  executionId: string = "";

  /** The name of the pipeline. */
  name: string = "";

  /** Information about the commit that initiated the pipeline.
   * id: The commit it
   * author: The author of the commit.
   * summary: The commit message.
   * link: A link to the website showing details for this commit.
   */
  commit: Commit;

  /** Manual approval information associated with the request.
   * link: A URL added for additional review before approval.
   * comment: Comments to be shared with the reviewer.
   */
  approvalAttributes: ManualApprovalAttributes;

  /* The name of the DB table that stores pipelog data.*/
  private readonly _dbTable: string;

  /** Array of failures, a failure has different properties depending on the type. */
  private _failed: LogEntry[];

  /* The name of the DB table that stores pipelog data.*/
  private readonly _codeProvider: BitBucket | GitHub;

  /* The dynamoDB client that will be used to communicate with Dynamo DB.*/
  private readonly dynamoDB: DynamoDBClient;

  /** Regex pattern used to extract a version string from S3 artifact keys. */
  private readonly _versionPattern: string;

  /** CodePipeline client for fetching S3 source keys via ListActionExecutions. */
  private readonly _codePipeline: CodePipeline | null;

  /** Default pattern: extracts semver (e.g. 1.4.2) or "latest" from S3 keys like "app/app-1.4.2.zip" */
  static readonly DEFAULT_VERSION_PATTERN = "-(\\d[\\d.]+|latest)\\.zip$";

  /** Set to true if a notification has been sent out for any failure within this pipeline. */
  isNotified: boolean;

  /** Bitbbucket API credentials for retrieving, commit information.  */
  BITBUCKET = {
    username: "",
    password: "",
  };

  /** Github API credentials for retrieving, commit information.  */
  GITHUB = {
    username: "",
    token: "",
  };

  constructor(
    dbTable: string,
    codeProvider: BitBucket | GitHub,
    dynamoDB: DynamoDBClient,
    versionPattern?: string,
    codePipeline?: CodePipeline | null,
  ) {
    this._dbTable = dbTable;

    this.dynamoDB = dynamoDB;

    this._codeProvider = codeProvider;

    this._versionPattern = versionPattern ?? PipeLog.DEFAULT_VERSION_PATTERN;

    this._codePipeline = codePipeline ?? null;

    this.commit = {
      id: "",
      author: "",
      summary: "",
      link: "",
    };

    this.approvalAttributes = {
      link: "",
      comment: "",
    };

    this._failed = [];

    this.isNotified = false;
  }

  /** Determines if this pipeline execution is considered to have failed. */
  get isFailed(): boolean {
    return this._failed.length > 0;
  }

  /** Returns the very first failure that occured in this pipeline process. */
  get failed(): LogEntry | null {
    if (this._failed.length === 0) return null;
    return this._failed[0];
  }

  /**
   * Loads the outcome from previous pipeline actions from storage. Retuns true if the
   * pipelog could be loaded. Returns false if the specified record could not be loaded.
   * @param {*} executionId The pipelines executrion id.
   */
  load = async (executionId: string): Promise<boolean> => {
    this.executionId = executionId;

    const params = {
      TableName: this._dbTable,
      Key: {
        executionId: { S: executionId },
      },
    };
    const command = new GetItemCommand(params);
    const { Item } = await this.dynamoDB.send(command);

    if (!Item) return false;

    const data = unmarshall(Item);
    this.executionId = executionId;
    this.name = data.name;
    this.commit = data.commit;
    this._failed = data.failed;
    this.isNotified = data.isNotified;
    return true;
  };

  /**
   * Saves the current state of pipeline actions to storage.
   * @returns
   */
  save = async (): Promise<PutItemCommandOutput> => {
    const params = {
      TableName: this._dbTable,
      Item: marshall({
        executionId: this.executionId,
        name: this.name,
        commit: this.commit,
        failed: this._failed,
        isNotified: this.isNotified,
      }),
    };
    const command = new PutItemCommand(params);
    return this.dynamoDB.send(command);
  };

  /**
   * Handles the incoming pipe notification message and extracts information required to
   * enrich the availabe information about the cause of the pipeline failure.
   * @param {CodePipelineActionEvent} event The AWS CodePipeline event to be processed.
   * @returns
   */
  handlePipelineAction = async (event: CodePipelineActionEvent) => {
    this.name = event.detail.pipeline;

    switch (event.detail.type.provider) {
      case "CodeStarSourceConnection":
        return this.handleCodestarActionEvent(event);

      case "S3":
        return this.handleS3ActionEvent(event);

      case "CodeBuild":
        return this.handleCodeBuildActionEvent(event);

      case "Manual":
        return this.handleManualApprovalEvent(event);

      case "CodeDeploy":
      default:
        return this.handleCodeDeployActionEvent(event);
    }
  };

  /**
   * Process incoming manual approval requests.
   * Adds any links and/or comments related to the request to the incoming pipeline message.
   * @param {CodePipelineActionEvent} event The AWS CodePipeline event to be processed.
   * @returns
   */
  private readonly handleManualApprovalEvent = async (
    event: CodePipelineActionEvent,
  ) => {
    const request = {
      link: event.additionalAttributes.externalEntityLink
        ? event.additionalAttributes.externalEntityLink
        : "",
      comment: event.additionalAttributes.customData
        ? event.additionalAttributes.customData
        : "",
    };

    this.approvalAttributes = request;
  };

  /**
   * Processes incoming commit actions. (Codestar).
   *
   * This function enriches the incoming SNS message with data retrieved from the
   * repository hosting service. For example the name of the commit author as well
   * as the commit message.
   *
   * @param {CodePipelineActionEvent} event The AWS CodePipeline event to be processed.
   * @returns
   */
  private readonly handleCodestarActionEvent = async (
    event: CodePipelineActionEvent,
  ) => {
    if (event.detail.stage !== "Source") return null;

    switch (event.detail.state) {
      case "SUCCEEDED": {
        if (!event.detail["execution-result"]) {
          throw new Error(
            "handleCodestarActionEvent is trying to process an event without execution-results.",
          );
        }

        /* Fetch usefull commit details from the repository hosting service (github/bitbucket/etc.). */
        const url = new URL(
          event.detail["execution-result"]["external-execution-url"],
        );
        const repo = url.searchParams.get("FullRepositoryId") || "";
        const commitId = url.searchParams.get("Commit") || "";

        try {
          this.commit = await this._codeProvider.fetchCommit(repo, commitId);
        } catch (error) {
          console.error("PipeLog: Failed to fetch commit from git provider:", error);
          this.commit = {
            id: commitId,
            author: "",
            summary: "(Failed to retrieve commit details from git provider)",
            link: "",
          };
        }
        await this.save();
        break;
      }

      case "FAILED": {
        const checkout: LogEntry = {
          id: "",
          type: "checkout",
          name: event.detail.action,
          message: event.detail["execution-result"]
            ? event.detail["execution-result"]["external-execution-summary"]
            : "",
        };
        this._failed.push(checkout);

        await this.save();

        return checkout;
      }
    }

    return null;
  };

  /**
   * Processes incoming S3 source actions.
   *
   * When a pipeline uses S3 as its source (e.g. artifact-based deployments), there is no
   * git commit to retrieve. Instead, the version is extracted from the S3 object key.
   *
   * The S3 object key is NOT available in the event payload (only a cache path is present).
   * The real key is fetched via the CodePipeline ListActionExecutions API which returns
   * the resolved configuration including any overrides from StartPipelineExecution.
   *
   * @param {CodePipelineActionEvent} event The AWS CodePipeline event to be processed.
   * @returns
   */
  private readonly handleS3ActionEvent = async (
    event: CodePipelineActionEvent,
  ) => {
    if (event.detail.stage !== "Source") return null;

    switch (event.detail.state) {
      case "SUCCEEDED": {
        const s3Key = await this.fetchS3ObjectKey(event);
        const version = this.extractVersionFromKey(s3Key);

        this.commit = {
          id: version || s3Key || "",
          author: "",
          summary: s3Key && version !== s3Key ? s3Key : "",
          link: "",
        };

        await this.save();
        break;
      }

      case "FAILED": {
        const checkout: LogEntry = {
          id: "",
          type: "checkout",
          name: event.detail.action,
          message: event.detail["execution-result"]
            ? event.detail["execution-result"]["external-execution-summary"]
            : "",
        };
        this._failed.push(checkout);

        await this.save();

        return checkout;
      }
    }

    return null;
  };

  /**
   * Fetches the actual S3 object key for a source action.
   *
   * Uses the CodePipeline ListActionExecutions API to get the resolved configuration
   * which contains the real S3 object key (including any overrides). Falls back to
   * reading from the event's output-artifacts if the API is unavailable.
   */
  private async fetchS3ObjectKey(
    event: CodePipelineActionEvent,
  ): Promise<string> {
    // Try the API first — this returns the actual source key (not the cache path)
    if (this._codePipeline) {
      try {
        const pipelineName = event.detail.pipeline;
        const executionId = event.detail["execution-id"];
        const key = await this._codePipeline.fetchS3SourceKey(
          pipelineName,
          executionId,
        );
        if (key) return key;
      } catch (error) {
        console.error(
          "PipeLog: Failed to fetch S3 source key via API, falling back to event data:",
          error,
        );
      }
    }

    // Fallback: use the event payload (may be a cache path in cross-account scenarios)
    return this.extractS3KeyFromEvent(event);
  }

  /**
   * Extracts the S3 object key from a source action event payload.
   * This reads from output-artifacts or execution-result and may return
   * a CodePipeline cache path rather than the actual source key.
   *
   * Cache paths (e.g. "pipeline/SourceArti/MjPeWp2.zip") are detected and
   * rejected — they are internal CodePipeline artifact paths, not the real source key.
   */
  private extractS3KeyFromEvent(event: CodePipelineActionEvent): string {
    // Output artifacts contain the S3 location with bucket and key
    const outputArtifacts = event.detail["output-artifacts"];
    if (outputArtifacts && outputArtifacts.length > 0) {
      const key = outputArtifacts[0].s3location.key;
      if (!this.isCachePath(key)) return key;
    }

    // Fallback: external-execution-id — for S3 source this is typically the S3 version ID, not the key
    if (event.detail["execution-result"]) {
      const extId =
        event.detail["execution-result"]["external-execution-id"] || "";
      if (extId && !this.isCachePath(extId)) return extId;
    }

    return "";
  }

  /**
   * Detects whether a value is a CodePipeline internal cache/artifact path or an S3
   * version ID rather than the actual source S3 object key.
   *
   * Cache paths follow the pattern: "{name}/SourceArti/{hash}.zip"
   * S3 version IDs are opaque alphanumeric strings (no path separators).
   */
  private isCachePath(key: string): boolean {
    // CodePipeline cache paths contain "SourceArti" or similar truncated artifact name segments
    if (/\/SourceArti\//.test(key)) return true;
    // Detect other CodePipeline artifact cache patterns (7-char random hash before extension)
    if (/\/[A-Za-z0-9]{7}\.(zip|tar\.gz)$/.test(key)) return true;
    // S3 version IDs are opaque strings with no path separator and no file extension
    if (!key.includes("/") && !key.includes(".")) return true;
    return false;
  }

  /**
   * Extracts a version string from an S3 object key using the configured version pattern.
   * Returns the first capture group match, or the full key if no match is found.
   */
  private extractVersionFromKey(s3Key: string): string {
    if (!s3Key) return "";

    try {
      const regex = new RegExp(this._versionPattern);
      const match = regex.exec(s3Key);
      if (match && match[1]) {
        return match[1];
      }
    } catch (error) {
      console.error("PipeLog: Invalid versionPattern regex:", error);
    }

    // Fallback: return the full key if pattern doesn't match
    return s3Key;
  }

  /**
   * Process message originating from CodeBuild.
   * @param {CodePipelineActionEvent} event The AWS CodePipeline event to be processed.
   * @returns
   */
  private readonly handleCodeBuildActionEvent = async (
    event: CodePipelineActionEvent,
  ) => {
    if (
      event.detail.type.provider !== "CodeBuild" ||
      event.detail.state !== "FAILED"
    ) {
      return null;
    }

    const build: LogEntry = {
      id: event.detail["execution-result"]
        ? event.detail["execution-result"]["external-execution-id"]
        : "",
      type: "build",
      name: event.detail.action,
      link: event.detail["execution-result"]
        ? event.detail["execution-result"]["external-execution-url"]
        : "",
    };

    this._failed.push(build);
    await this.save();

    return build;
  };

  /**
   * Process message originating from CodeDeploy.
   * @param {CodePipelineActionEvent} event The AWS CodePipeline event to be processed.
   * @returns
   */
  private readonly handleCodeDeployActionEvent = async (
    event: CodePipelineActionEvent,
  ) => {
    /* Process a Deployment Failed Action */
    if (
      event.detail.type.provider !== "CodeDeploy" ||
      event.detail.state !== "FAILED"
    ) {
      return null;
    }

    const deploy: LogEntry = {
      id: event.detail["execution-result"]
        ? event.detail["execution-result"]["external-execution-id"]
        : "",
      type: "deploy",
      name: event.detail.action,
      summary: event.detail["execution-result"]
        ? event.detail["execution-result"]["external-execution-summary"]
        : "",
      link: event.detail["execution-result"]
        ? event.detail["execution-result"]["external-execution-url"]
        : "",
    };

    this._failed.push(deploy);
    await this.save();
    return deploy;
  };
}
