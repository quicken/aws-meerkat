# aws-code-pipeline-monitor

The code pipeline monitor collects and enriches pipeline notification events making the aggregated data available to subsequent notification events.

The lambda execution role required the following permissions in addition to the standard lambda execution permissions:

- dynamodb:PutItem (To the table created for this lambda)
- dynamodb:GetItem (To the table created for this lambda)
- codebuild:BatchGetBuilds
- sts:AssumeRole (If using cross account deployments, the role assumed to interact with code deploy. See the information for the DEPLOY_ARN environment variables.)

## Setup

The SNS Topic to which the lambda is subscribed must receive all of the following Code Pipeline Events.

#### Action execution

- failed (The bot determines pipeline failure only based on failed actions)
- succeeded (This is required to capture the git checkout in order to retrieve commit details that are not available from AWS.)

#### Pipeline execution

- failed (Messages are only sent on this event to avoid spamming users for a single pipeline failure. The event is NOT used to determine if the pipeline failed.)

## Environment Variables

#### BITBUCKET_USERNAME

The username used to connect to the bitbucket API.

#### BITBUCKET_PASSWORD

The password used to authenticate with the bitbucket API.

#### DB_TABLE (optional)

The name of the DynomDb table that is used to manage pipeline logs. Defaults to: "devops-pipeline-monitor".

The table must have Partition key of type string named executionId.

See the cloudformation template in the cloudformation folder for an example definition.

#### DEPLOY_ARN (optional)

The role that is assumed when retrieving failure information from the code deploy service. This allows
retrieving information accross AWS accounts. The lambda execution role must be able to assume the specified
role. Only required if doing cross account deployments.

The specified deploy role must have the following permissions:

- codedeploy:BatchGetDeploymentTargets
- codedeploy:ListDeploymentTargets

In cases where deployment environments are hosted in multiple AWS Accounts the agent can be configured to assume
roles in different AWS Accounts based on the pipe line name.

For example: You have three AWS Accounts.

- a) DevOpsIn - This is the AWS Account where the pipeline is defined and this lambda runs.
- b) Testing - This is an AWS account to which testing builds are deployed.
- c) Production - This is an AWS account to which production builds are deployed.

You can have a single lambda function handle notifications for all environments use the pipeline name.

Pipeline for testing could be called: "my-testing-pipeline", while the production pipeline could be named "the-real-deal:

To set the Arn for testing define and envrionment variabled named "DEPLOY_ARN_testing". To set the Arn for production set another
environment variable "DEPLOY_ARN_real-deal"

If "DEPLOY_ARN" is defined it will be used if no other more specifc DEPLOY_ARN\*\* variable matches.

Finally if the envrionment variable is set to empty string or no DEPLOY_ARN variables are specified then the role assigned to the
lambda function will be used to call the Code Deploy API.

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

#### AWS_PROFILE

For unit testing only. The full username that commited the TEST_BITBUCKET_COMMIT. This variables is used when asserting fetching
commit information.

#### TEST_BITBUCKET_AUTHOR

The raw author name returned by the bitbucket api. The unit test asserts against this author.

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
