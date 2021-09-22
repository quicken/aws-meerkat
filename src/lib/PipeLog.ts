import * as https from "https";
import { URL } from "url";

import {
  CodeBuildClient,
  BatchGetBuildsCommand,
} from "@aws-sdk/client-codebuild";

import {
  CodeDeployClient,
  BatchGetDeploymentTargetsCommand,
  BatchGetDeploymentTargetsCommandInput,
} from "@aws-sdk/client-codedeploy";

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  PutItemCommandOutput,
} from "@aws-sdk/client-dynamodb";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleCommandInput,
} from "@aws-sdk/client-sts";

interface FailureType {
  id: string;
  type: string;
  name: string;
  link?: string;
  message?: string;
}

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
  commit = {
    id: "",
    author: "",
    summary: "",
    link: "",
  };

  /** Array of failures, a failure has different properties depending on the type. */
  failed: FailureType[];

  /** Set to true if a notification has been sent out for any failure within this pipeline. */
  isNotified: boolean;

  /** Bitbbucket API credentials for retrieving, commit information.  */
  BITBUCKET = {
    username: "",
    password: "",
  };

  constructor(username: string, password: string) {
    this.executionId = "";

    this.name = "";

    this.commit = {
      id: "",
      author: "",
      summary: "",
      link: "",
    };

    this.failed = [];

    this.isNotified = false;

    this.BITBUCKET = {
      username: username,
      password: password,
    };
  }

  /** Determines if this pipeline execution is considered to have failed. */
  get isFailed(): boolean {
    return this.failed.length > 0;
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
      TableName: "ax-devop-pipeline",
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
      this.failed = data.failed;
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
      TableName: "ax-devop-pipeline",
      Item: marshall({
        executionId: this.executionId,
        naem: this.name,
        commit: this.commit,
        failed: this.failed,
        isNotified: this.isNotified,
      }),
    };
    const command = new PutItemCommand(params);
    return dynamoDB.send(command);
  };

  /**
   * Parses the incoming message and extracts information required to
   * provide details about the cause of the pipeline failure.
   * @param {'*'} message The SNS message which was received from the pipeline.
   * @returns
   */
  applyMessage = async (message: any): Promise<any> => {
    this.name = message.detail.pipeline;

    /* Process a "checkout" action. (Retrieve commit information) */
    if (
      message.detail.stage === "Source" &&
      message.detail.state === "SUCCEEDED" &&
      message.detail.type.provider === "CodeStarSourceConnection"
    ) {
      const url = new URL(
        message.detail["execution-result"]["external-execution-url"]
      );
      const repo = url.searchParams.get("FullRepositoryId");
      const commitId = url.searchParams.get("Commit");
      try {
        let commit = await this.fetchCommit(
          this.BITBUCKET.username,
          this.BITBUCKET.password,
          repo || "",
          commitId || ""
        );
        commit = commit.body;
        this.commit.id = commitId ? commitId : "";
        this.commit.author = commit.author.raw;
        this.commit.summary = commit.summary.raw;
        this.commit.link = commit.links.self.href;
      } catch (e) {
        console.log(e);
      }

      return this.failed;
    }

    /* Process a Check-out Failed Action */
    if (
      message.detail.state === "FAILED" &&
      message.detail.type.provider === "CodeStarSourceConnection"
    ) {
      const checkout = {
        id: "",
        type: "checkout",
        name: message.detail.action as string,
        message: message.detail["execution-result"][
          "external-execution-summary"
        ] as string,
      };
      this.failed.push(checkout);
      return this.failed;
    }

    /* Process a Build Failed Action */
    if (
      message.detail.state === "FAILED" &&
      message.detail.type.provider === "CodeBuild"
    ) {
      const build = {
        id: message.detail["execution-result"]["external-execution-id"],
        type: "build",
        name: message.detail.action,
        link: message.detail["execution-result"]["external-execution-url"],
      };
      this.failed.push(build);
      return this.failed;
    }

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

      const deploy = {
        id: deployId,
        type: "deploy",
        name: message.detail.action,
        summary: summary,
        link: link,
      };
      this.failed.push(deploy);
      return this.failed;
    }

    return this.failed;
  };

  /**
   * Get details for the specified commit from the bit bucket api.
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/commit/%7Bcommit%7D
   *
   * @param {*} username Bitbucket username.
   * @param {*} password Bitbucket password. (This should be an App Password.)
   * @param {*} repo The repository id in the format "{workspace}/{repository}".
   * @param {*} commitId The id of the commit for which information should be retrieved.
   * @returns A promise which resolves to a object containing the commit information. See the bitbucket api
   * documentation for details.
   */
  fetchCommit = (
    username: string,
    password: string,
    repo: string,
    commitId: string
  ): Promise<any> => {
    const AUTHORIZATION = Buffer.from(username + ":" + password).toString(
      "base64"
    );
    const options = {
      hostname: "api.bitbucket.org",
      port: 443,
      path: `/2.0/repositories/${repo}/commit/${commitId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + AUTHORIZATION,
      },
    };

    return this.callEndpoint(options, "");
  };

  /**
   * Get details for the specified commit from the bit bucket api.
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/commit/%7Bcommit%7D
   *
   * @param {*} username Bitbucket username.
   * @param {*} password Bitbucket password. (This should be an App Password.)
   * @param {*} repo The repository id in the format "{workspace}/{repository}".
   * @param {*} commitId The id of the commit for which information should be retrieved.
   * @returns A promise which resolves to a object containing the commit information. See the bitbucket api
   * documentation for details.
   */
  postToDiscord = async (
    path: string,
    title: string,
    description: string,
    fields: string,
    footer: string
  ): Promise<any> => {
    const content = JSON.stringify({
      username: "AWS Notification",
      avatar_url:
        "https://s3.ap-southeast-2.amazonaws.com/fs.tst.axcelerate.com/ax-devops/discord_bug.png?fgf",
      content: "",
      embeds: [
        {
          title: title,
          color: 10038562,
          description: description,
          fields: fields,
          footer: {
            text: footer,
          },
        },
      ],
    });

    const options = {
      hostname: "discord.com",
      port: 443,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": content.length,
      },
    };

    return this.callEndpoint(options, content);
  };

  /**
   * Calls a HTTPS endpoint without requring any special imports.
   *
   * @param {*} options A https options object.
   * @param {*} content The content to be passed in the request.
   * @returns A promise which returns the body and statuscode of the response.
   */
  callEndpoint = (options: any, content: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      let incoming = "";
      const req = https.request(options, (res) => {
        res.on("data", (chunk) => {
          incoming += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            let body = incoming;
            try {
              body = JSON.parse(incoming);
            } catch (e) {
              body = incoming;
            }

            resolve({
              statuscode: 200,
              body: body,
            });
          }

          reject({
            statuscode: res.statusCode,
            body: incoming,
          });
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(content);
      req.end();
    });
  };

  /**
   * Assume a role in another account the returned structure can the be used to
   * initialise another AWS SDK object. The object will then use the credentials
   * created by this method for all calls.
   *
   * For example:
   * const credentials = await PipeLog.fetchCredentials(sts);
   * const dynamodb = new AWS.DynamoDB({credentials:credentials});
   *
   * All calls intiated with dynamodb will not use the credentials from the
   * assumed role.
   *
   * @param {*} sts The aws STS object from the aws-sdk.
   * @returns Credentials which can be passed to the credentials property when intialising
   * aws sdk objects.
   */
  fetchCredentials = async (sts: STSClient, roleArn: string): Promise<any> => {
    const param: AssumeRoleCommandInput = {
      RoleArn: roleArn,
      RoleSessionName: "mySessionName",
    };

    const command = new AssumeRoleCommand(param);

    const data = await sts.send(command);

    return {
      accessKeyId: data.Credentials?.AccessKeyId,
      secretAccessKey: data.Credentials?.SecretAccessKey,
      sessionToken: data.Credentials?.SessionToken,
    };
  };

  /**
   * Attempt to retrieve the cause of a deployment failure.
   *
   * @param {*} deploymentId The id of the deployment.
   * @param {*} codeDeploy From the AWS-SDK the codedeploy object used to make
   * calls to the api. Note: The object should have been initialised with the credentials
   * of a assumed role in which the code deployment has been provisioned.
   * @returns
   */
  fetchCodeDeploy = async (
    deploymentId: string,
    codeDeploy: CodeDeployClient
  ) => {
    const param: BatchGetDeploymentTargetsCommandInput = {
      deploymentId: deploymentId,
    };

    const command = new BatchGetDeploymentTargetsCommand(param);
    const targets = await codeDeploy.send(command);

    if (!targets.deploymentTargets) return;

    return targets.deploymentTargets.map((target) => {
      const out = {
        instanceid: target.instanceTarget?.targetId,
        diagnostics: {},
      };

      if (target.instanceTarget?.lifecycleEvents) {
        for (
          let j = 0;
          j <= target.instanceTarget.lifecycleEvents.length;
          j++
        ) {
          const lifeEvent = target.instanceTarget?.lifecycleEvents[j];
          if (lifeEvent.status === "Failed") {
            out.diagnostics = lifeEvent.diagnostics || "";
            break;
          }
        }
      }

      return out;
    });
  };

  /**
   * Attempt to retrieve the link to the build log.
   *
   * @param {*} buildId The id of the build.
   * @param {*} codeDeploy From the AWS-SDK the codedeploy object used to make
   * calls to the api. Note: The object should have been initialised with the credentials
   * of a assumed role in which the code deployment has been provisioned.
   * @returns
   */
  fetchCodeBuild = async (
    buildId: string,
    codeBuild: CodeBuildClient
  ): Promise<string> => {
    const params = {
      ids: [buildId],
    };
    const command = new BatchGetBuildsCommand(params);

    const buildBatchResult = await codeBuild.send(command);

    if (!buildBatchResult.builds) return "";
    const build = buildBatchResult.builds[0];
    return build.logs?.deepLink || "";
  };
}
