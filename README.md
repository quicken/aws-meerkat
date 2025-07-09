# Meerkat - AWS DevOp Bot for Discord

![image info](https://raw.githubusercontent.com/wiki/quicken/aws-meerkat/img/meerkat-sml.png)

Meerkat works to deliver your AWS CodePipeline status and AWS CloudWatch Alarms to your Discord channel.

Where Meerkat shines is when it listens to AWS Code Pipeline Life Cycle Events. Meerkat tracks each action for pipeline execution. In the case of a pipeline failure
Meerkat will run off and fetch helpful troubleshooting data before sending you an easily readable notification. To reduce noise pipeline action events are intentionally filtered so you will only receive one message per pipeline execution.

![image info](https://raw.githubusercontent.com/wiki/quicken/aws-meerkat/img/meerkat-build-failed.png)

## Features

- All pipeline failures include the Commit Message, Author and a link to the commit.
- Build failures include a link to viewing the code build, and build log.
- Deploy failures (EC2) show the script and reason for the deployment failure.
- Deployment information is retrieved across AWS accounts.
- Beautify cloud watch alarms and shows state changes.
- Posts to Discord.
- Works with GitHub and Bitbucket.

## Getting Started

### You will need:

- Your GitHub Username and Personal AccessToken or Bitbucket Username & Password
- Your repository id
- Your repository URL (The HTTP URL you would use with git clone)
- Discord Webhook Url
- A hosted .png file for the Discord avatar. 128px X 128px
- An AWS account (obviously)
- An AWS S3 Bucket.

### Provisioning Meerkat

- Upload the release zip file to your S3 Bucket and make a note of the bucket name and object key.
- Create a cloud formation stack using the cloud formation template provided in this repository: /cloudformation meerkat.yaml

The cloud formation will provision the resources and permission required by Meerkat.

If you already have an SNS Topic that is receiving Code Pipeline Events or Cloud Watch alarms simply subscribe meerkat to that topic. Otherwise, you can use the
provisioned SNS Topic as a target for notifications.

## Code Pipeline Bot

For the bot to receive success and failure notifications.

### Code Pipeline Events;

The bot requires notification of the following events so that the bot can collate the information required
to send notifications that are useful for troubleshooting build and deployment failures.

- Pipeline execution Failed
- Pipeline execution Succeeded
- Action execution Failed
- Action execution Succeeded.

#### Pipeline execution Failed

Raises a notification if the Pipeline Execution Fails. However, this event does not contain sufficient detail to troubleshoot the pipeline failure.

As such, notifications based on this event rely on the availability of information collected by processing any associated "Action Events.
Action events should be enabled to enrich notifications with troubleshooting data.

#### Pipeline execution Succeeded

Raises a notification if the Pipeline Execution succeeds.

#### Action execution Succeeded

Allows collecting commit information from the Source Provider. (GitHub or Bitbucket)

#### Action execution Failed

Allows collecting detailed information causing the pipeline failure. Failed CodeDeploy actions show diagnostic information related to the first instance to which deployment failed.
In the case of a CodeBuild failure, show a link to the build log.

#### Sample Code Pipeline

This repository also contains an example cloud formation template that will provision an AWS Code pipeline that will send a notification to Discord using Meerkat.

## Setup

The SNS Topic to which the Lambda is subscribed must receive all of the following Code Pipeline Events.

#### Action execution

- failed (The bot determines pipeline failure only based on failed actions)
- succeeded (This is required to capture the git checkout to retrieve commit details that are not available from AWS.)

#### Pipeline execution

- success (Success messages are only sent on this event to avoid spamming users for a single pipeline success.)
- failed (Failed messages are only sent on this event to avoid spamming users for a single pipeline failure. The event is NOT used to determine if the pipeline failed.)

## Required Permissions

The Lambda execution role requires the following permissions in addition to the standard Lambda execution permissions:

- dynamodb:PutItem (To the table created for this lambda)
- dynamodb:GetItem (To the table created for this lambda)
- codebuild:BatchGetBuilds
- sts:AssumeRole (If using cross-account deployments, the role that is assumed to interact with code deploy. See the information for the DEPLOY_ARN environment variables.)

## Environment Variables

#### CHAT_SERVICE (optional)

Set the chat service that is used to deliver notifications. The only current option is: "discord"

#### DB_TABLE (optional)

The name of the DynomDb table that is used to manage pipeline logs. Defaults to: "devops-pipeline-monitor".

The table must have a Partition key of type string named "executionId".

See the cloud formation template in the "cloudformation" folder for an example definition.

#### DEPLOY_ARN (optional)

The role that is assumed when retrieving failure information from the code deploy service. This allows
retrieving information across AWS accounts. The Lambda execution role must be able to assume the specified
role. Only required if doing cross-account deployments.

The specified deploy role must have the following permissions:

- codedeploy:BatchGetDeploymentTargets
- codedeploy:ListDeploymentTargets

In cases where deployment environments are hosted in multiple AWS Accounts, the agent can be configured to assume
roles in different AWS Accounts based on the pipeline name.

For example, You have three AWS Accounts.

- a) DevOpsIn - This is the AWS Account where the pipeline is defined and this lambda runs.
- b) Testing - This is an AWS account to which testing builds are deployed.
- c) Production - This is an AWS account to which production builds are deployed.

You can have a single lambda function handle notifications for all environments using the pipeline name.

The pipeline for testing could be called: "my-testing-pipeline", while the production pipeline could be named "the-real-deal:

To set the Arn for testing define and environment variables named "DEPLOY_ARN_testing". To set the Arn for production set another
environment variable "DEPLOY_ARN_real-deal"

If "DEPLOY_ARN" is defined it will be used as a fallback in the case that no DEPLOY_ARN\*\* variables can be matched to the pipeline name.

Finally, if the environment variable is set to an empty string or no DEPLOY_ARN variables are specified then the role assigned to the
lambda function will be used to call the Code Deploy API.

Constructive feedback, feature requests and discussions are welcomed.

#### Discord_AVATAR

A public URL to an image that will be used as the Discord avatar. The image is shown next to the message thread. The image must conform to the dimensions required by Discord.

A 128px x 128px png file with alpha transparency is known to work.

#### Discord_USERNAME (optional)

Override the displayed username when posting to Discord.

#### Discord_WEBHOOK

The Discord webhook to which notifications are posted.

#### GIT_PASSWORD

The password that is used to connect to the git provider. For GitHub, this is a Personal Access Token with permission to read commits.

#### GIT_PROVIDER (optional)

The service hosting the repository. Valid values are "bitbucket" or "github". The default is: github

#### GIT_USERNAME

The username that is used to connect to the git provider.

#### SLACK_WEBHOOK

The webhook to which notifications are being sent. Only required if slack is being used as the chat service.

#### SLACK_BOT_TOKEN (optional)

The Slack Bot Token (starts with `xoxb-`) used for advanced Slack Web API features like user lookup and mentions. 
When configured, the bot will attempt to mention users by looking up their Slack user ID based on their git commit email address.

To obtain this token:
1. Create a Slack App at https://api.slack.com/apps
2. Add OAuth Scopes: `users:read` and `users:read.email`
3. Install the app to your workspace
4. Copy the Bot User OAuth Token

If not provided, notifications will still work via webhook but without user mentions.

## Development Environment

Create a .env file in the project root and specify the environment variables.

### Building

The build script expects to be run from a bash terminal. The zip package must also be installed.
(sudo apt install zip). If on windows use the Linux subsystem for Windows (WSL)

### Environment variables for development

#### AWS_PROFILE

The name of the local AWS profile used to connect to AWS. When running in production
this variable is not required as the SDK will use the role assigned to the Lambda.

For the details of setting up AWS profiles see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html

#### DYNAMO_ENDPOINT

Set this to point to the Dynamo DB endpoint to which PipeLogs are saved. To work with the
provided docker container on the local machine set this to: http://localhost:8000"

#### INTEGRATION_TESTS

Set this value to true to run integration tests as a part of the unit testing suite.
Integration test require a connection to Dynamo DB. Run the local docker container or
use a profile that can connect to AWS.

```:bash
$MEERKAT/_dev/start.sh
```

#### MEERKAT_HOME

The environment variable should contain the absolute filesystem path to the "root" of this project.

## Known Issues

There is a Bug/Feature in jest where running a single test will execute all tests if the file name of the single test is contained in the absolute
file-path on the system.

For example, suppose the project root is in the file system at: /home/jack/meerkat. Running a test called "meerkat" or "user" will run ALL unit-tests
since those words are contained in the absolute file path.

As a workaround, the "meerkat" unit test has been renamed to meerkat-service.test.ts.
