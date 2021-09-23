import {
  CodeDeployClient,
  BatchGetDeploymentTargetsCommand,
  BatchGetDeploymentTargetsCommandInput,
  ListDeploymentTargetsInput,
  ListDeploymentTargetsCommand,
} from "@aws-sdk/client-codedeploy";

import { InstanceDiagnosticType, DiagnosticType } from "../types";

export class CodeDeploy {
  /**
   * Returns the failure reason for the first failed life cycle event of each instance that
   * is a target for this deployment. If an instance has no failures the
   * diagnostics property will be null.
   *
   * @param {*} deploymentId The id of the deployment.
   * @param {*} codeDeploy From the AWS-SDK the codedeploy object used to make
   * calls to the api. Note: The object should have been initialised with the credentials
   * of a assumed role of the AWS account in which the code deployment has been provisioned.
   * @returns An array of instances to which code was deployed. If deployment fails for an instance the diagnostic
   * property will contain the details from the very first life cycle event that failed on that instance.
   */
  public static deployDetails = async (
    deploymentId: string,
    codeDeploy: CodeDeployClient
  ) => {
    /* Find EC2 instances for this deployment*/
    const listDeploymentTargetsInput: ListDeploymentTargetsInput = {
      deploymentId: deploymentId,
    };

    const listDeploymentTargetsCommand = new ListDeploymentTargetsCommand(
      listDeploymentTargetsInput
    );
    const deploymentTargets = await codeDeploy.send(
      listDeploymentTargetsCommand
    );

    /* Retrieve the details of the first life cycle event that failed on each instance. */
    const param: BatchGetDeploymentTargetsCommandInput = {
      deploymentId: deploymentId,
      targetIds: deploymentTargets.targetIds,
    };

    const command = new BatchGetDeploymentTargetsCommand(param);
    const targets = await codeDeploy.send(command);

    if (!targets.deploymentTargets) return [];

    return targets.deploymentTargets.map((target) => {
      if (target.deploymentTargetType === "InstanceTarget") {
        const out: InstanceDiagnosticType = {
          instanceid: target.instanceTarget?.targetId || "",
          diagnostics: null,
        };

        if (target.instanceTarget?.lifecycleEvents) {
          for (const lifeCycleEvent of target.instanceTarget.lifecycleEvents) {
            if (lifeCycleEvent.status === "Failed") {
              out.diagnostics = lifeCycleEvent.diagnostics as DiagnosticType;
              break;
            }
          }
        }

        return out;
      }
    });
  };
}
