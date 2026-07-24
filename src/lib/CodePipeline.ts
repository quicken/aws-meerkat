import { STSClient } from "@aws-sdk/client-sts";
import {
  CodePipelineClient,
  CodePipelineClientConfig,
  ListActionExecutionsCommand,
  ListActionExecutionsCommandInput,
} from "@aws-sdk/client-codepipeline";
import { Util } from "./Util";

export class CodePipeline {
  private client: CodePipelineClient;

  constructor(client: CodePipelineClient) {
    this.client = client;
  }

  /**
   * Fetches the resolved S3 object key used by the Source action of a pipeline execution.
   *
   * This calls ListActionExecutions filtered to the given execution ID, finds the S3 Source
   * action, and returns the `S3ObjectKey` from the resolved configuration. This is the actual
   * key used for the execution (including any overrides from StartPipelineExecution).
   *
   * @param pipelineName The name of the pipeline.
   * @param executionId The pipeline execution ID.
   * @returns The S3 object key used by the source action, or empty string if not found.
   */
  async fetchS3SourceKey(
    pipelineName: string,
    executionId: string,
  ): Promise<string> {
    const input: ListActionExecutionsCommandInput = {
      pipelineName,
      filter: {
        pipelineExecutionId: executionId,
      },
    };

    const command = new ListActionExecutionsCommand(input);
    const response = await this.client.send(command);

    if (!response.actionExecutionDetails) return "";

    // Find the S3 Source action
    for (const action of response.actionExecutionDetails) {
      if (
        action.input?.actionTypeId?.provider === "S3" &&
        action.input?.actionTypeId?.category === "Source"
      ) {
        // Prefer outputVariables.ObjectKey — this is the actual key used for this execution
        const outputKey = action.output?.outputVariables?.["ObjectKey"];
        if (outputKey) return outputKey;

        // Fallback to resolvedConfiguration (may be static config, not the actual key)
        const resolvedKey =
          action.input?.resolvedConfiguration?.["S3ObjectKey"];
        if (resolvedKey) return resolvedKey;

        // Last fallback: static configuration
        const configKey = action.input?.configuration?.["S3ObjectKey"];
        if (configKey) return configKey;
      }
    }

    return "";
  }

  /**
   * Creates the configuration for instantiating the CodePipelineClient.
   *
   * Specifying a role ARN provides the ability to make calls across AWS accounts,
   * provided the role executing the Lambda has permission to assume the role.
   *
   * @param rolearn The ARN of the role to assume. If empty, uses Lambda's own credentials.
   * @param region The AWS region where the pipeline runs. If empty, uses SDK default (Lambda's region).
   */
  static readonly createClientConfig = async (
    rolearn?: string,
    region?: string,
  ): Promise<CodePipelineClientConfig> => {
    const config: CodePipelineClientConfig = {};

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
}
