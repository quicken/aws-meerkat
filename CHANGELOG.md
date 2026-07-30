# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2026-07-24

### Breaking Changes

- **Node 22 minimum** — runtime updated from Node 20 to Node 22; Lambda runtime set to `nodejs22.x`
- **Configuration via SSM Parameter Store** — git credentials (GitHub/Bitbucket), Discord settings, and routing config are now stored in a single SSM SecureString parameter instead of environment variables. Set `MEERKAT_CONFIG_PARAM` to the parameter name.
- **Removed environment variables** — `GIT_USERNAME`, `GIT_PASSWORD`, `GIT_EMAIL`, `DISCORD_WEBHOOK`, `DISCORD_AVATAR`, `DISCORD_USERNAME` are no longer read from env vars. Migrate these to the SSM config parameter.
- **Bitbucket auth** — migrated from username/password to email/API token authentication
- **`account` field required** — `PipelineNotification` and `AlarmNotification` types now require an `account` field (source AWS account ID)

### Added

- **Cross-account pipeline support** — Meerkat can receive and route pipeline events from multiple AWS accounts via cross-account SNS publish
- **Cross-account alarm support** — CloudWatch alarm notifications include source account ID for routing
- **Account-based routing** — route notifications by source account ID (e.g. `account:123456789012`)
- **Account friendly names** — optional `accounts` map in config displays human-readable names (e.g. `[production]`) in message titles
- **`deployRoleTemplate` config** — single IAM role template with `{account}` placeholder for cross-account role assumption, replacing per-pipeline env var approach
- **S3 source version extraction** — for S3-sourced pipelines, extracts the artifact version from `ListActionExecutions` API (`output.outputVariables.ObjectKey`)
- **Cross-region SDK clients** — CodePipeline, CodeBuild, and CodeDeploy clients respect the event's source region
- **CodeBuild cross-account** — `BatchGetBuilds` calls now use assumed-role credentials for remote accounts
- **`MEERKAT_CONFIG_FILE` env var** — load config from a local JSON file for development
- **CloudFormation `AllowedSourceAccounts` parameter** — scoped SNS topic policy for cross-account publish
- **CloudFormation `LoggingConfig`** — JSON-format Lambda logging with configurable log levels
- **Manual approval improvements** — account labels, author tagging via Slack user lookup, conditional approval link rendering
- **`resolveDeployArn()` resolution order** — same-account detection → `deployRoleTemplate` → legacy `DEPLOY_ARN_{term}` → `DEPLOY_ARN` fallback

### Changed

- **TypeScript 6.0.3** — upgraded from 5.2.2
- **AWS SDK v3 → 3.1068.0**
- **Jest → 30.4.2**
- **esbuild → 0.28.1**
- **eslint → 10.5.0**
- **`Util.callEndpoint`** — rewritten to use native `fetch` (Node 22 built-in), removed `node:https` and `node:url` dependencies
- **Type files** — migrated `src/types/AwsCodePipeline.d.ts` and `src/types/common.d.ts` to `.ts`
- **SlackChat/SlackRoute** — simplified via dependency injection (receives config in constructor)
- **DiscordChat** — receives config via constructor instead of `process.env`
- **`package.sh`** — derives artifact filename from `package.json` name + version

### Fixed

- **Manual approval broken link** — no longer renders `<|View Approval>` when no review URL is configured
- **Cross-region pipelines** — SDK clients now use the event's region, fixing "Commit details unavailable" for pipelines in non-default regions
- **S3 source cache path** — rejects CodePipeline internal artifact paths and S3 version IDs; uses actual source key from `ListActionExecutions`
- **Test mocks** — fixed `TS2540` readonly errors in GitHub/BitBucket tests for TypeScript 6 compatibility
