import {
  CodeBuildClient,
  BatchGetBuildsCommand,
} from "@aws-sdk/client-codebuild";

export class CodeBuild {
  codeBuild: CodeBuildClient;

  constructor(codeBuild: CodeBuildClient) {
    this.codeBuild = codeBuild;
  }
  /**
   * Returns ta url of the cloud watch build log in the AWS Web Console.
   *
   * @param {*} buildId The id of the build.
   * @param {*} codeDeploy From the AWS-SDK the codedeploy object used to make
   * calls to the api. Note: The object should have been initialised with the credentials
   * of a assumed role in which the code deployment has been provisioned.
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
