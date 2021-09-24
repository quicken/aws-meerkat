import { PipeLog } from "./PipeLog";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodeBuild } from "./CodeBuild";
import { STSClient } from "@aws-sdk/client-sts";
import {
  CodeDeployClient,
  CodeDeployClientConfig,
} from "@aws-sdk/client-codedeploy";
import { CodeDeploy } from "./CodeDeploy";
import { Util } from "./Util";
import { LogEntryType, BuildLogEntryType, DeployLogEntryType } from "../types";

const REGION = process.env.REGION || "";

export class Service {
  public static getFirstFailure = async (
    pipelog: PipeLog
  ): Promise<LogEntryType | null> => {
    if (!pipelog.failed) return null;

    let failedLogEntry = { ...pipelog.failed } as LogEntryType;

    switch (failedLogEntry.type) {
      case "build":
        {
          const codeBuild = new CodeBuildClient({ region: REGION });
          const logUrl = await CodeBuild.fetchBuildLogUrl(
            failedLogEntry.id,
            codeBuild
          );

          failedLogEntry = {
            ...failedLogEntry,
            ...{ build: { logUrl: logUrl } },
          } as BuildLogEntryType;
        }
        break;

      case "deploy":
        {
          const config: CodeDeployClientConfig = { region: REGION };

          const deployArn = Util.getDeployArnFromEnv(pipelog.name, process.env);
          if (deployArn) {
            const stsClient = new STSClient({ region: REGION });
            const credentials = await Util.fetchCredentials(
              stsClient,
              deployArn
            );

            config.credentials = credentials;
          }

          const codeDeploy = new CodeDeployClient(config);

          const deployTargets = await CodeDeploy.deployDetails(
            failedLogEntry.id,
            codeDeploy
          );

          failedLogEntry = {
            ...failedLogEntry,
            ...{ deploy: { targets: deployTargets } },
          } as DeployLogEntryType;
        }
        break;
    }

    return failedLogEntry;
  };
}
