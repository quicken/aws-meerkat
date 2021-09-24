import { URL } from "url";
import { BitBucket } from "./BitBucket";
import { GitHub } from "./GitHub";
import { CommitType, LogEntryType } from "../types";

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  PutItemCommandOutput,
} from "@aws-sdk/client-dynamodb";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * A class which bundles method required to provide notifications which provide context to the
 * cause of a pipeline build failure.
 *
 * Messages sent by AWS Codepipeline do not contain full information about a failure. Therefore, this
 * class is used to track a pipeline execution using Dynamo DB. This class also contains methods for
 * retrieving more detailed information on support services in order to create notifications which provide
 * context to a build failue.
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
  executionId: string;

  /** The name of the pipeline. */
  name: string;

  /** Information about the commit that initiated the pipeline.
   * id: The commit it
   * author: The author of the commit.
   * summary: The commit message.
   * link: A link to the website showing details for this commit.
   */
  commit: CommitType;

  /* The name of the DB table that stores pipelog data.*/
  private _dbTable: string;

  /** Array of failures, a failure has different properties depending on the type. */
  private _failed: LogEntryType[];

  /* The name of the DB table that stores pipelog data.*/
  private _codeProvider: BitBucket | GitHub;

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

  constructor(dbTable: string, codeProvider: BitBucket | GitHub) {
    this.executionId = "";

    this.name = "";

    this._dbTable = dbTable;

    this._codeProvider = codeProvider;

    this.commit = {
      id: "",
      author: "",
      summary: "",
      link: "",
    };

    this._failed = [];

    this.isNotified = false;
  }

  /** Determines if this pipeline execution is considered to have failed. */
  get isFailed(): boolean {
    return this._failed.length > 0;
  }

  /** Returns the very first failure that occured in this pipeline process. */
  get failed(): LogEntryType | null {
    if (this._failed.length === 0) return null;
    return this._failed[0];
  }

  /**
   * Loads the outcome from previous pipeline actions from storage.
   * @param {*} executionId The pipelines executrion id.
   * @param {*} dynamoDB A dynamoDb client object from the AWS SDK.
   */
  load = async (
    executionId: string,
    dynamoDB: DynamoDBClient
  ): Promise<void> => {
    this.executionId = executionId;

    const params = {
      TableName: this._dbTable,
      Key: {
        executionId: { S: executionId },
      },
    };
    const command = new GetItemCommand(params);
    const { Item } = await dynamoDB.send(command);

    /* If a key does not exist dynamo db returns an empty object. */
    if (Item) {
      const data = unmarshall(Item);
      this.executionId = executionId;
      this.name = data.name;
      this.commit = data.commit;
      this._failed = data.failed;
      this.isNotified = data.isNotified;
    }
  };

  /**
   * Saves the current state of pipeline actions to storage.
   *
   * @param {*} dynamoDB A dynamoDb client object from the AWS SDK.
   * @returns
   */
  save = async (dynamoDB: DynamoDBClient): Promise<PutItemCommandOutput> => {
    const params = {
      TableName: this._dbTable,
      Item: marshall({
        executionId: this.executionId,
        naem: this.name,
        commit: this.commit,
        failed: this._failed,
        isNotified: this.isNotified,
      }),
    };
    const command = new PutItemCommand(params);
    return dynamoDB.send(command);
  };

  /**
   * Handles the incoming pipe notification message and extracts information required to
   * enrich the availabe information about the cause of the pipeline failure.
   * @param {'*'} message The SNS message which was received from the pipeline.
   * @returns
   */
  handleEvent = async (message: any): Promise<void> => {
    this.name = message.detail.pipeline;

    switch (message.detail.type.provider) {
      case "CodeStarSourceConnection":
        await this.handleCodestarEvent(message);
        break;
      case "CodeBuild":
        this.handleCodeBuildEvent(message);
        break;
      case "CodeDeploy":
        this.handleCodeDeployEvent(message);
        break;
    }
  };

  /**
   * Processes incoming commit actions. (Codestar).
   *
   * This function enriches the incoming SNS message with data retrieved from the
   * repository hosting service. For example the name of the commit author as well
   * as the commit message.
   *
   * @param message
   */
  private handleCodestarEvent = async (message: any) => {
    if (
      message.detail.stage === "Source" &&
      message.detail.state === "SUCCEEDED"
    ) {
      /* Fetch usefull commit details from the repository hosting service (bitbucket). */
      const url = new URL(
        message.detail["execution-result"]["external-execution-url"]
      );
      const repo = url.searchParams.get("FullRepositoryId") || "";
      const commitId = url.searchParams.get("Commit") || "";
      try {
        this.commit = await this._codeProvider.fetchCommit(repo, commitId);
      } catch (e) {
        console.log(e);
      }
    }

    if (message.detail.state === "FAILED") {
      const checkout = {
        id: "",
        type: "checkout",
        name: message.detail.action as string,
        message: message.detail["execution-result"][
          "external-execution-summary"
        ] as string,
      };
      this._failed.push(checkout);
    }
  };

  /**
   * Process message originating from CodeBuild.
   * @param message
   * @returns
   */
  private handleCodeBuildEvent = async (message: any) => {
    if (
      message.detail.state === "FAILED" &&
      message.detail.type.provider === "CodeBuild"
    ) {
      const build: LogEntryType = {
        id: message.detail["execution-result"]["external-execution-id"],
        type: "build",
        name: message.detail.action,
        link: message.detail["execution-result"]["external-execution-url"],
      };
      this._failed.push(build);
    }
  };

  /**
   * Process message originating from CodeDeploy.
   * @param message
   * @returns
   */
  private handleCodeDeployEvent = async (message: any) => {
    /* Process a Deployment Failed Action */
    if (
      message.detail.state === "FAILED" &&
      message.detail.type.provider === "CodeDeploy"
    ) {
      const deployId = message.detail["execution-result"].hasOwnProperty(
        "external-execution-id"
      )
        ? message.detail["execution-result"]["external-execution-id"]
        : "";
      const summary = message.detail["execution-result"].hasOwnProperty(
        "external-execution-summary"
      )
        ? message.detail["execution-result"]["external-execution-summary"]
        : "";
      const link = message.detail["execution-result"].hasOwnProperty(
        "external-execution-url"
      )
        ? message.detail["execution-result"]["external-execution-url"]
        : "";

      const deploy: LogEntryType = {
        id: deployId,
        type: "deploy",
        name: message.detail.action,
        summary: summary,
        link: link,
      };

      this._failed.push(deploy);
    }
  };
}
