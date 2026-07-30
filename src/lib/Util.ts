import {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleCommandInput,
} from "@aws-sdk/client-sts";

export type SimpleHttpResponse<T> = {
  statuscode: number;
  body: T;
};

export class Util {
  /**
   * Calls a HTTPS endpoint using fetch. Follows redirects automatically.
   *
   * @param url The full URL to call.
   * @param options Fetch request options.
   * @returns A promise which returns the body and statuscode of the response.
   */
  public static readonly callEndpoint = async <T>(
    url: string,
    options: RequestInit = {},
  ): Promise<SimpleHttpResponse<T>> => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const body = await response.text();
      const httpError = new Error(`HTTP error ${response.status}`);
      (httpError as NodeJS.ErrnoException).code = String(response.status);
      throw Object.assign(httpError, { statuscode: response.status, body });
    }

    const text = await response.text();
    let body: T;
    try {
      body = JSON.parse(text);
    } catch {
      body = text as unknown as T;
    }

    return { statuscode: response.status, body };
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
  public static readonly fetchCredentials = async (
    sts: STSClient,
    roleArn: string,
  ): Promise<any> => {
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
   * Provides a mechanism to use the pipeline name and a naming convention for
   * environment variables to control the ARN that should
   * be used when calling the CODE Deploy SDK.
   *
   * The pattern is DEPLOY_ARN_{searchterm}
   *
   * If the variable DEPLOY_ARN is undefined or the search does not match a
   * empty string is returned.
   *
   * If DEPLOY_ARN is defined it will be used when the search does not match.
   *
   * The sub string for the search is embedded into the environment variable name. For
   * example to specify the ARN for any pipe line with the word production in the name
   * create and environment variable named: DEPLOY_ARN_production. The match is case
   * insenstive.
   *
   * @param name  The name of the code pipeline.
   * @param env The process.env object or a similar object.
   * @returns The ARN of the role that is assumed when calling the AWS Deploy SDK.
   */
  public static readonly getDeployArnFromEnv = (
    name: string,
    env: any,
  ): string => {
    const defaultArn = env.DEPLOY_ARN ? env.DEPLOY_ARN : "";
    for (const key in env) {
      if (key.startsWith("DEPLOY_ARN")) {
        const searchTerm = key.split("_").slice(2).join("_").toLowerCase();
        if (searchTerm && name.toLowerCase().includes(searchTerm)) {
          return env[key];
        }
      }
    }
    return defaultArn;
  };
}
