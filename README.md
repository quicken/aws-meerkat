# aws-code-pipeline-monitor

The code pipeline monitor collects and enriches pipeline notification events making the aggregated data available to subsequent notification events.

## Development Environment

Create a .env file in the project root to specify the following
environment variables.

#### AWS_PROFILE

The name of the local AWS profile used to connect to AWS. When running in production
this variable is not required as the SDK will use the role assigned to the Lambda.

For the details of setting up AWS profiles see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html

#### BITBUCKET_USERNAME

The username used to connect to the bitbucket API.

#### BITBUCKET_PASSWORD

The password used to authenticate with the bitbucket API.

#### DISCORD_WEBHOOK

The discord webook to which notifications are posted.
