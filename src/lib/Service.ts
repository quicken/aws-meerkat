import { PipeLog } from "./PipeLog";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodeBuild } from "./CodeBuild";
import { STSClient } from "@aws-sdk/client-sts";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodeDeploy } from "./CodeDeploy";
import { Util } from "./Util";
import { LogEntryType, BuildLogEntryType, DeployLogEntryType } from "../types";

const CODE_DEPLOY_ARN = process.env.CODE_DEPLOY_ARN || "";
const AWS_REGION = process.env.AWS_REGION || "";

export class Service {
  public static getFirstFailure = async (pipelog: PipeLog) => {
    if (!pipelog.failed) return null;

    let failedLogEntry = { ...pipelog.failure } as LogEntryType;

    switch (failedLogEntry.type) {
      case "build":
        const codeBuild = new CodeBuildClient({ region: AWS_REGION });
        const logUrl = await CodeBuild.fetchBuildLogUrl(
          failedLogEntry.id,
          codeBuild
        );

        failedLogEntry = {
          ...failedLogEntry,
          ...{ build: { logUrl: logUrl } },
        } as BuildLogEntryType;
        break;

      case "deploy":
        const stsClient = new STSClient({ region: AWS_REGION });
        const credentials = await Util.fetchCredentials(
          stsClient,
          CODE_DEPLOY_ARN
        );

        const codeDeploy = new CodeDeployClient({
          region: AWS_REGION,
          credentials: credentials,
        });

        const deployTargets = await CodeDeploy.deployDetails(
          failedLogEntry.id,
          codeDeploy
        );

        failedLogEntry = {
          ...failedLogEntry,
          ...{ deploy: { targets: deployTargets } },
        } as DeployLogEntryType;
        break;
      default:
    }

    return failedLogEntry;
  };
}
