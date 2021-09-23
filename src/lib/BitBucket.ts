import { Util } from "./Util";
import { CommitType } from "../types";

export class BitBucket {
  /** Username for calling the Bitbucket API.  */
  private _username: string;

  /** Password for calling the Bitbucket API.  */
  private _password: string;

  /** The repository id in the format "{workspace}/{repository}". */
  private _repo: string;

  /**
   *
   * @param repo    The repository id in the format "{workspace}/{repository}"
   * @param username    Username for calling the Bitbucket API.
   * @param password    Password for calling the Bitbucket API.
   */
  constructor(repo: string, username: string, password: string) {
    this._repo = repo;
    this._username = username;
    this._password = password;
  }

  /**
   * Get details for the specified commit from the bit bucket api.
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/commit/%7Bcommit%7D
   *
   * @param {*} commitId The id of the commit for which information should be retrieved.
   * @returns A promise which resolves to a object containing the commit information. See the bitbucket api
   * documentation for details.
   */
  fetchCommit = async (commitId: string): Promise<CommitType> => {
    const AUTHORIZATION = Buffer.from(
      this._username + ":" + this._password
    ).toString("base64");

    const options = {
      hostname: "api.bitbucket.org",
      port: 443,
      path: `/2.0/repositories/${this._repo}/commit/${commitId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + AUTHORIZATION,
      },
    };

    let response = await Util.callEndpoint(options, "");

    return {
      id: commitId,
      author: response.body.author.raw,
      summary: response.body.summary.raw,
      link: response.body.links.self.href,
    };
  };
}
