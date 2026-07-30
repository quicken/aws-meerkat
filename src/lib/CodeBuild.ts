import { STSClient } from "@aws-sdk/client-sts";
import {
  CodeBuildClient,
  CodeBuildClientConfig,
  BatchGetBuildsCommand,
} from "@aws-sdk/client-codebuild";
import { Util } from "./Util";

export class CodeBuild {
  codeBuild: CodeBuildClient;

  constructor(codeBuild: CodeBuildClient) {
    this.codeBuild = codeBuild;
  }

  /**
   * Creates the configuration for instantiating the CodeBuildClient.
   *
   * Specifying a role ARN provides the ability to make calls across AWS accounts,
   * provided the role executing the Lambda has permission to assume the role.
   *
   * @param rolearn The ARN of the role to assume. If empty, uses Lambda's own credentials.
   * @param region The AWS region where the build runs. If empty, uses SDK default (Lambda's region).
   */
  static readonly createClientConfig = async (
    rolearn?: string,
    region?: string,
  ): Promise<CodeBuildClientConfig> => {
    const config: CodeBuildClientConfig = {};

    if (region) {
      config.region = region;
    }

    if (rolearn) {
      const stsClient = new STSClient({});
      const credentials = await Util.fetchCredentials(stsClient, rolearn);
      config.credentials = credentials;
    }

    return config;
  };
  /**
   * Returns ta url of the cloud watch build log in the AWS Web Console.
   * @param {*} buildId The id of the build.
   * @returns The url of the cloud watch build log viewer for this build.
   */
  public fetchBuildLogUrl = async (buildId: string): Promise<string> => {
    const params = {
      ids: [buildId],
    };
    const command = new BatchGetBuildsCommand(params);

    const buildBatchResult = await this.codeBuild.send(command);

    if (!buildBatchResult.builds) return "";
    const build = buildBatchResult.builds[0];
    return build.logs?.deepLink || "";
  };
}
