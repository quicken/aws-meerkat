# AWS Meerkat - Amazon Q Development Guide

## Project Overview

AWS Meerkat is a TypeScript-based AWS DevOps bot that delivers AWS CodePipeline status and CloudWatch Alarms to Discord/Slack channels. It processes SNS events from AWS services and provides intelligent notifications with troubleshooting information.

## Architecture

### Core Components

- **Meerkat.ts**: Main orchestrator that processes SNS events and routes to appropriate bots
- **Bot System**: Modular bot architecture for different AWS services
  - `CodePipelineBot`: Handles AWS CodePipeline events
  - `CloudWatchAlertBot`: Processes CloudWatch alarms
  - `SimpleBot`: Fallback for unrecognized messages
- **Chat Services**: Pluggable chat integrations
  - `DiscordChat`: Discord webhook integration
  - `SlackChat`: Slack webhook integration
- **AWS Service Integrations**: 
  - CodeBuild, CodeDeploy, DynamoDB clients
  - Cross-account role assumption support
- **Git Providers**: GitHub and Bitbucket integration for commit information

### Key Technologies

- **Runtime**: AWS Lambda (Node.js)
- **Language**: TypeScript 5.2.2
- **AWS SDK**: v3 (modular imports)
- **Testing**: Jest with aws-sdk-client-mock
- **Build**: Custom bash scripts with esbuild
- **Infrastructure**: CloudFormation templates

## Development Environment Setup

### Prerequisites

```bash
# Node.js version (check .nvmrc)
nvm use

# Install dependencies
npm install
# or
yarn install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for development
AWS_PROFILE=your-aws-profile
DYNAMO_ENDPOINT=http://localhost:8000  # For local DynamoDB
INTEGRATION_TESTS=true
MEERKAT_HOME=/absolute/path/to/project

# Bot Configuration
CHAT_SERVICE=discord  # or slack
DB_TABLE=devops-pipeline-monitor

# Git Provider Settings
GIT_PROVIDER=github  # or bitbucket
GIT_USERNAME=your-username
GIT_PASSWORD=your-token

# Discord Settings
DISCORD_WEBHOOK=your-webhook-url
DISCORD_AVATAR=your-avatar-url
DISCORD_USERNAME=AWS Notification

# Slack Settings (if using Slack)
SLACK_WEBHOOK=your-slack-webhook
SLACK_BOT_TOKEN=xoxb-your-bot-token  # Optional: for user mentions

# Cross-account deployment (optional)
DEPLOY_ARN=arn:aws:iam::account:role/role-name
DEPLOY_ARN_testing=arn:aws:iam::test-account:role/role-name
DEPLOY_ARN_production=arn:aws:iam::prod-account:role/role-name

# Debug Settings
TRACE_EVENTS=true
```

### Local Development

```bash
# Start local DynamoDB (if needed)
./_dev/start.sh

# Run tests
npm test

# Build project
npm run build

# Start locally
npm start

# Lint code
npm run lint

# Generate documentation
npm run docs
```

## Common Development Tasks with Amazon Q

### Adding New Bot Types

When adding support for new AWS services:

1. **Create Bot Class**:
   ```typescript
   // src/bot/NewServiceBot.ts
   export class NewServiceBot extends Bot {
     async handleMessage(rawMessage: RawMessage): Promise<Notification | null> {
       // Implementation
     }
   }
   ```

2. **Update Bot Factory**:
   ```typescript
   // In Meerkat.ts botFactory method
   if (body.serviceSpecificField) {
     return new NewServiceBot();
   }
   ```

### Adding New Chat Services

To add support for new chat platforms:

1. **Implement Chat Interface**:
   ```typescript
   // src/chat/NewChatService.ts
   export class NewChatService implements Chat {
     async sendNotification(notification: Notification): Promise<void> {
       // Implementation
     }
   }
   ```

2. **Update Chat Factory**:
   ```typescript
   // In Meerkat.ts chatFactory method
   case "newservice":
     return new NewChatService();
   ```

### Working with AWS Services

The project uses AWS SDK v3 with modular imports. Common patterns:

```typescript
// Client initialization
const client = new ServiceClient({
  region: 'us-east-1',
  // Cross-account role assumption
  credentials: assumeRoleCredentials
});

// Command execution
const command = new GetSomethingCommand({ param: value });
const response = await client.send(command);
```

### Testing Strategies

```bash
# Run all tests
npm test

# Run specific test file
npm test -- CodePipelineBot.test.ts

# Run with coverage
npm test -- --coverage

# Integration tests (requires AWS/DynamoDB)
INTEGRATION_TESTS=true npm test
```

### CloudFormation Development

The project includes CloudFormation templates in `/cloudformation/`:

- `meerkat.yaml`: Main infrastructure template
- `sample_pipeline.yaml`: Example CodePipeline setup

Key resources provisioned:
- Lambda function with execution role
- DynamoDB table for pipeline tracking
- SNS topic for notifications
- IAM roles and policies

### Build and Deployment

```bash
# Build TypeScript
npm run build

# Create deployment package
npm run bundle
# or
./package.sh

# Deploy via CloudFormation
aws cloudformation deploy \
  --template-file cloudformation/meerkat.yaml \
  --stack-name meerkat-bot \
  --parameter-overrides \
    S3Bucket=your-bucket \
    S3Key=meerkat.zip \
    DiscordWebhook=your-webhook
```

## Code Organization Best Practices

### File Structure
```
src/
├── bot/           # Bot implementations
├── chat/          # Chat service integrations  
├── lib/           # AWS service wrappers
├── types/         # TypeScript type definitions
├── Meerkat.ts     # Main orchestrator
└── index.ts       # Lambda entry point
```

### Type Safety
- All AWS service responses are properly typed
- Custom types defined in `src/types/`
- Strict TypeScript configuration enabled

### Error Handling
- Graceful degradation for missing data
- Comprehensive logging for debugging
- Proper AWS SDK error handling

## Debugging and Troubleshooting

### Common Issues

1. **DynamoDB Connection**: Ensure `DYNAMO_ENDPOINT` is set for local development
2. **AWS Permissions**: Lambda execution role needs appropriate permissions
3. **Cross-Account Access**: Verify assume role permissions and trust relationships
4. **Git Provider Authentication**: Check token permissions and expiration

### Logging

The application uses console.log for CloudWatch Logs integration:

```typescript
console.log("Processing pipeline event:", executionId);
console.error("Failed to process:", error.message);
```

### Testing SNS Events

Use the AWS CLI to test SNS message processing:

```bash
aws sns publish \
  --topic-arn arn:aws:sns:region:account:topic \
  --message file://test-event.json
```

## Performance Considerations

- **Lambda Cold Starts**: Minimize by keeping dependencies lean
- **DynamoDB**: Use efficient query patterns with partition keys
- **AWS SDK**: Use modular imports to reduce bundle size
- **Cross-Account Calls**: Cache assumed role credentials when possible

## Security Best Practices

- **Environment Variables**: Never commit secrets to version control
- **IAM Roles**: Follow principle of least privilege
- **Cross-Account Access**: Use temporary credentials via assume role
- **Webhook URLs**: Treat as sensitive data

## Contributing Guidelines

1. **Code Style**: Follow existing TypeScript/ESLint configuration
2. **Testing**: Add unit tests for new functionality
3. **Documentation**: Update README.md and inline comments
4. **Type Safety**: Maintain strict TypeScript compliance
5. **AWS Best Practices**: Follow AWS SDK v3 patterns

## Useful Amazon Q Prompts

- "Help me add support for AWS CodeCommit events to the CodePipelineBot"
- "Show me how to implement retry logic for failed Discord webhook calls"
- "Create a new bot for processing AWS Config compliance notifications"
- "Help me optimize the DynamoDB queries in PipeLog.ts"
- "Add support for Microsoft Teams chat integration"
- "Help me implement CloudFormation drift detection notifications"

## Resources

- [AWS Lambda TypeScript Guide](https://docs.aws.amazon.com/lambda/latest/dg/typescript-handler.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Discord Webhook Documentation](https://discord.com/developers/docs/resources/webhook)
- [AWS CodePipeline Events](https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html)
