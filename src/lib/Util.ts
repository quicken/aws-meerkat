import * as https from "https";

import {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleCommandInput,
} from "@aws-sdk/client-sts";

export class Util {
  /**
   * Calls a HTTPS endpoint without requring any special imports.
   *
   * @param {*} options A https options object.
   * @param {*} content The content to be passed in the request.
   * @returns A promise which returns the body and statuscode of the response.
   */
  public static callEndpoint = (
    options: any,
    content: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      let incoming = "";
      const req = https.request(options, (res) => {
        res.on("data", (chunk) => {
          incoming += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            let body;
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
  public static fetchCredentials = async (
    sts: STSClient,
    roleArn: string
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
}
