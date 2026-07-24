import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import * as fs from "fs-extra";

export interface SlackRouteRule {
  expression: string;
  channel: string;
}

export interface MeerkatConfigData {
  accounts?: Record<string, string>;
  artifactSource?: {
    /** Regex pattern with a capture group to extract version from S3 object key.
     *  Default: "-(\\d[\\d.]+|latest)\\.zip$" — extracts semver or "latest" from keys like "app/app-1.4.2.zip"
     */
    versionPattern?: string;
  };
  bitbucket?: {
    email: string;
    token: string;
  };
  /** IAM role ARN template for cross-account access. Use {account} as placeholder for the
   *  source AWS account ID. At runtime, {account} is replaced with the event's account ID.
   *  e.g. "arn:aws:iam::{account}:role/my-cross-account-role"
   */
  deployRoleTemplate?: string;
  discord?: {
    webhook: string;
    avatar?: string;
    username?: string;
  };
  github?: {
    username: string;
    token: string;
  };
  slack?: {
    botToken: string;
    defaultChannel: string;
    routes: SlackRouteRule[];
  };
}

const CONFIG_FILE_ENV = "MEERKAT_CONFIG_FILE";
const CONFIG_PARAM_ENV = "MEERKAT_CONFIG_PARAM";

/**
 * Loads Meerkat configuration from a local file or SSM Parameter Store.
 *
 * Environment variables:
 * - MEERKAT_CONFIG_FILE: Local file path (takes priority, for development)
 * - MEERKAT_CONFIG_PARAM (required if no file): SSM parameter name
 */
export async function loadConfig(): Promise<MeerkatConfigData> {
  const configFilePath = process.env[CONFIG_FILE_ENV];
  if (configFilePath) {
    return loadConfigFromFile(configFilePath);
  }

  const parameterName = process.env[CONFIG_PARAM_ENV];
  if (!parameterName) {
    throw new Error(`Environment variable ${CONFIG_PARAM_ENV} is required`);
  }
  return loadConfigFromSsm(parameterName);
}

async function loadConfigFromFile(
  filePath: string,
): Promise<MeerkatConfigData> {
  console.log(`Loading Meerkat config from local file: ${filePath}`);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function loadConfigFromSsm(
  parameterName: string,
): Promise<MeerkatConfigData> {
  const ssmClient = new SSMClient({});
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });
  const response = await ssmClient.send(command);

  if (response.Parameter?.Value) {
    return JSON.parse(response.Parameter.Value);
  }

  return {};
}

/**
 * Resolves the IAM role ARN to assume for cross-account API calls (CodeDeploy, CodePipeline, etc.)
 *
 * Resolution order:
 * 1. If event account matches Lambda's own account → return "" (use Lambda credentials)
 * 2. If deployRoleTemplate is set in config → substitute {account} with event account ID
 * 3. If DEPLOY_ARN_{term} env var matches pipeline name → use that (legacy)
 * 4. If DEPLOY_ARN env var is set → use that (legacy default)
 * 5. Return "" (use Lambda credentials)
 *
 * @param eventAccount The AWS account ID from the event (where the pipeline/alarm runs)
 * @param pipelineName The pipeline name (for legacy DEPLOY_ARN matching)
 * @param config The loaded Meerkat config (may contain deployRoleTemplate)
 * @param env The process.env object
 * @returns The ARN to assume, or "" to use Lambda's own credentials
 */
export function resolveDeployArn(
  eventAccount: string,
  pipelineName: string,
  config: MeerkatConfigData | null,
  env: Record<string, string | undefined> = process.env,
  lambdaAccount?: string,
): string {
  // Step 1: If event is from Lambda's own account, no role assumption needed.
  // lambdaAccount is derived from context.invokedFunctionArn at runtime.
  if (lambdaAccount && eventAccount === lambdaAccount) {
    return "";
  }

  // Step 2: deployRoleTemplate in config
  if (config?.deployRoleTemplate && eventAccount) {
    return config.deployRoleTemplate.replace(/\{account\}/g, eventAccount);
  }

  // Step 3 & 4: Legacy DEPLOY_ARN env var resolution (pipeline name substring match)
  return getDeployArnFromEnv(pipelineName, env);
}

/**
 * Legacy DEPLOY_ARN resolution: matches pipeline name against DEPLOY_ARN_{term} env vars.
 *
 * The substring for the search is embedded in the environment variable name. For
 * example, to specify the ARN for any pipeline with the word "production" in the name,
 * create an environment variable named: DEPLOY_ARN_production. The match is case insensitive.
 *
 * If DEPLOY_ARN is defined, it is used as a fallback when no specific match is found.
 * If DEPLOY_ARN is undefined or the search does not match, an empty string is returned.
 */
export function getDeployArnFromEnv(
  pipelineName: string,
  env: Record<string, string | undefined>,
): string {
  const defaultArn = env.DEPLOY_ARN ?? "";
  for (const key in env) {
    if (key.startsWith("DEPLOY_ARN_")) {
      const searchTerm = key.slice("DEPLOY_ARN_".length).toLowerCase();
      if (searchTerm && pipelineName.toLowerCase().includes(searchTerm)) {
        return env[key] ?? "";
      }
    }
  }
  return defaultArn;
}
