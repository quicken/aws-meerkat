# Meerkat - AWS DevOp Bot for Discord

![image info](https://raw.githubusercontent.com/wiki/quicken/aws-meerkat/img/meerkat-sml.png)

Meerkat works to deliver your AWS CodePipeline status and AWS CloudWatch Alarms to your Discord channel.

Where Meerkat shines is when it listens to AWS Code Pipeline Life Cycle Events. Meerkat tracks each action for pipeline execution. In the case of a pipeline failure
Meerkat will run off and fetch helpful troubleshooting data before sending you an easily readable notification. To reduce noise pipeline action events are intentionally filtered so you will only receive one message per pipeline execution.

![image info](https://raw.githubusercontent.com/wiki/quicken/aws-meerkat/img/meerkat-build-failed.png)

## Features

- All pipeline failures include the Commit Message, Author and a link to the commit.
- Build failures include a link to viewing the code build, build log.
- Deploy failures (EC2) show the script and reason for the deployment failure.
- Deployment information is retrieved across AWS accounts.
- Beautify cloud watch alarms and shows state changes.
- Posts to Discord.
- Works with GitHub and Bitbucket.

## Getting Started

### You will need:

- Your GitHub Username and Personal AccessToken or Bitbucket Username & Password
- Your repository id
- Your repository URL (The http url you would use with git clone)
- Discord Webhook Url
- A hosted .png file for the discord avatar. 128px X 128px
- An AWS Account (obviously)
- An AWS S3 Bucket.

### Provisioning Meerkat

- Upload the release zip file to your S3 Bucket and make a note of the bucket name and object key.
- Create a cloudformation stack using the cloudformation template provided in this repository: /cloudformation meerkat.yaml

The cloudformation will provision the resources and permission required by meerkat.

If you already have a SNS Topic that is receiving Code Pipeline Events or Cloud Watch alarms simply subribe meerkat to that topic. Otherwise, you can use the
provisioned SNS Topic as a target for notifications.

#### Sample Code Pipeline

This repository also contains an example cloud formation template that will provision an end to end AWS Code pipeline that will send notification to discord using Meerkat.

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

#### GIT_PASSWORD

The password that is used to connect to the git provider. For GitHub this is a Personal Access Token with permission to read commits.

#### GIT_PROVIDER (optional)

The service hosting the repository. Valid values are "bitbucket" or "github". The default is: github

#### GIT_USERNAME

The username that is used to connect to the git provider.

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

You can have a single lambda function handle notifications for all environments use the pipeline name.

Pipeline for testing could be called: "my-testing-pipeline", while the production pipeline could be named "the-real-deal:

To set the Arn for testing define and environment variables named "DEPLOY_ARN_testing". To set the Arn for production set another
environment variable "DEPLOY_ARN_real-deal"

If "DEPLOY_ARN" is defined it will be used as a fallback in the case that no DEPLOY_ARN\*\* variables can be matched to the pipeline name.

Finally, if the environment variable is set to empty string or no DEPLOY_ARN variables are specified then the role assigned to the
lambda function will be used to call the Code Deploy API.

Constructive feedback, feature requests and discussions are welcomed.

#### DISCORD_AVATAR

A public URL to an image that will be used as the discord avatar. The image is shown next to the message thread. The image must conform to the dimensions required by discord.

A 128px x 128px png file with alpha transparency is known to work.

#### DISCORD_USERNAME (optional)

Override the username that is shown in discord.

#### DISCORD_WEBHOOK

The discord webhook to which notifications are posted.

#### REGION

The AWS region that will be used when calling AWS services.

## Development Environment

Create a .env file in the project root and specify the environment variables below.

### Building

The build script expects to be run from a bash terminal. The zip package must also be installed.
(sudo apt install zip). If on windows use the Linux subsystem for windows (WSL)

#### AWS_PROFILE

The name of the local AWS profile used to connect to AWS. When running in production
this variable is not required as the SDK will use the role assigned to the Lambda.

For the details of setting up AWS profiles see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html

### Environment variables for running Unit-Test

#### TEST_CODE_BUILD_ID

For unit testing only. A code build deployment id from a failed build.

## Known Issues

There is a Bug/Feature in jest where running a single test will execute all tests if the file name of the single test is contained in the absolute
file-path on the system.

For example, suppose the project root is in the file system at: /home/jack/meerkat. Running a test called "meerkat" or "user" will run ALL unit-tests
since those words are contained in the absolute file path.

As a workaround, the "meerkat" unit test has been renamed to meerkat-service.test.ts.
