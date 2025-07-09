import { Util } from "./Util";
import { Commit } from "../types/common";

export class BitBucket {
  /** Username for calling the Bitbucket API.  */
  private _username: string;

  /** Password for calling the Bitbucket API.  */
  private _password: string;

  /**
   *
   * @param username    Username for calling the Bitbucket API.
   * @param password    Password for calling the Bitbucket API.
   */
  constructor(username: string, password: string) {
    this._username = username;
    this._password = password;
  }

  /**
   * Get details for the specified commit from the bit bucket api.
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/commit/%7Bcommit%7D
   *
   * @param repo    The repository id in the format "{workspace}/{repository}"
   * @param {*} commitId The id of the commit for which information should be retrieved.
   * @returns A promise which resolves to a object containing the commit information. See the bitbucket api
   * documentation for details.
   */
  fetchCommit = async (repo: string, commitId: string): Promise<Commit> => {
    const AUTHORIZATION = Buffer.from(
      this._username + ":" + this._password
    ).toString("base64");

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

    const response = await Util.callEndpoint<any>(options, "");

    const authorRaw = response.body.author.raw;
    // Extract email from raw author string (format: "Name <email@domain.com>")
    const emailMatch = authorRaw.match(/<([^>]+)>/);
    const authorEmail = emailMatch ? emailMatch[1] : undefined;

    return {
      id: commitId,
      author: authorRaw,
      authorEmail: authorEmail,
      summary: response.body.summary.raw,
      link: response.body.links.html.href,
    };
  };
}
