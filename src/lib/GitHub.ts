import { Util } from "./Util";
import { Commit } from "../types";

export class GitHub {
  /** Username for calling the Bitbucket API.  */
  private _username: string;

  /** Personal token from your github account.  */
  private _token: string;

  /**
   *
   * @param username    Username for calling the GitHug API.
   * @param token    Personal token for calling the API.
   */
  constructor(username: string, token: string) {
    this._username = username;
    this._token = token;
  }

  /**
   * Get details for the specified commit from the bit bucket api.
   * https://api.github.com/repositories/409141660/git/commits/f7ec85262da48e2b15d03037b138963c5a89d39f
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/commit/%7Bcommit%7D
   * @param repo    The repository id.
   * @param {*} commitId The id of the commit for which information should be retrieved.
   * @returns A promise which resolves to a object containing the commit information. See the bitbucket api
   * documentation for details.
   */
  fetchCommit = async (repo: string, commitId: string): Promise<Commit> => {
    const AUTHORIZATION = Buffer.from(
      this._username + ":" + this._token
    ).toString("base64");

    const options = {
      hostname: "api.github.com",
      port: 443,
      path: `/repos/${repo}/git/commits/${commitId}`,
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "aws-codepipeline",
        "Content-Type": "application/json",
        Authorization: "Basic " + AUTHORIZATION,
      },
    };

    let response = await Util.callEndpoint<any>(options, "");
    if ([301, 302].includes(response.statuscode)) {
      /* Follow the redirect. (301,302) */
      options.path = response.body.url;
      response = await Util.callEndpoint<any>(options, "");
    }

    return {
      id: commitId,
      author: `${response.body.author.name} <${response.body.author.email}>`,
      summary: response.body.message,
      link: response.body.html_url,
    };
  };
}
