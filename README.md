# aws-code-pipeline-monitor

The code pipeline monitor collects and enriches pipeline notification events making the aggregated data available to subsequent notification events.

The lambda execution role required the following permissions in addition to the standard lambda execution permissions:

- dynamodb:PutItem
- dynamodb:GetItem
- codebuild:BatchGetBuilds
- sts:AssumeRole (The role assumed to interact with code deploy. See the CODE_DEPLOY_ARN in environment variables.)

## Environment Variables

#### BITBUCKET_USERNAME

The username used to connect to the bitbucket API.

#### BITBUCKET_PASSWORD

The password used to authenticate with the bitbucket API.

#### CODE_DEPLOY_ARN

The role that is assumed when retrieving failure information from the code deploy service. This allows
retrieving information accross AWS accounts. The lambda execution role must be able to assume the specified
role.

The specified deploy role must have the following permissions:

- codedeploy:BatchGetDeploymentTargets
- codedeploy:ListDeploymentTargets

#### DISCORD_AVATAR

A url to an image that will be used as the discord avatar. The image that is shown next to
message thread. The image must conform to the dimensions required by discord.

A 128px x 128px png file with alpha transparency is known to work.

#### DISCORD_WEBHOOK

The discord webook to which notifications are posted.

#### REGION

The aws region that will be used when calling AWS services.

## Development Environment

Create a .env file in the project root to specify the following
environment variables that are only required for local development and testing.

#### AWS_PROFILE

The name of the local AWS profile used to connect to AWS. When running in production
this variable is not required as the SDK will use the role assigned to the Lambda.

For the details of setting up AWS profiles see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html

### Environment variables for running Unit-Test

#### TEST_BITBUCKET_AUTHOR

For unit testing only. The full username that commited the TEST_BITBUCKET_COMMIT. This variables is used when asserting fetching
commit information.

#### TEST_BITBUCKET_COMMIT

For unit testing only. The commit id which is used by unit tests.

#### TEST_BITBUCKET_REPO

For unit testing only. The bitbucket repository id in the format "{workspace}/{repository}" that will be used
by unit tests.

e.g Given this command:

"git clone git@bitbucket.org:myuser/myrepo.git"

The repository id would be:

"myuser/myrepo.git"

#### TEST_CODE_BUILD_ID

For unit testing only. A code build deployment id from a failed build.

#### TEST_CODE_DEPLOY_ID

For unit testing only. A deployment ID where deployment to at least once ec2 instance failed.
