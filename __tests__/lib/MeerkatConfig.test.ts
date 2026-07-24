import { resolveDeployArn, getDeployArnFromEnv } from "../../src/lib/MeerkatConfig";

describe("resolveDeployArn", () => {
  test("returns empty string when event account matches lambdaAccount (same account)", () => {
    const result = resolveDeployArn("111122223333", "my-pipeline", null, {}, "111122223333");
    expect(result).toBe("");
  });

  test("uses deployRoleTemplate when event account differs from Lambda account", () => {
    const config = {
      deployRoleTemplate:
        "arn:aws:iam::{account}:role/cross-account-role",
    };
    const result = resolveDeployArn("444455556666", "my-deploy-pipeline", config, {}, "111122223333");
    expect(result).toBe(
      "arn:aws:iam::444455556666:role/cross-account-role",
    );
  });

  test("substitutes {account} in template with event account ID", () => {
    const config = {
      deployRoleTemplate: "arn:aws:iam::{account}:role/my-role",
    };
    const result = resolveDeployArn("111111111111", "any-pipeline", config, {});
    expect(result).toBe("arn:aws:iam::111111111111:role/my-role");
  });

  test("substitutes multiple {account} placeholders", () => {
    const config = {
      deployRoleTemplate:
        "arn:aws:iam::{account}:role/{account}-notification",
    };
    const result = resolveDeployArn("222222222222", "pipe", config, {});
    expect(result).toBe(
      "arn:aws:iam::222222222222:role/222222222222-notification",
    );
  });

  test("falls back to DEPLOY_ARN_{term} when no template configured", () => {
    const env = {
      DEPLOY_ARN: "arn:default",
      DEPLOY_ARN_production: "arn:prod-role",
    };
    const result = resolveDeployArn(
      "444455556666",
      "my-production-pipeline",
      null,
      env,
    );
    expect(result).toBe("arn:prod-role");
  });

  test("falls back to DEPLOY_ARN default when no template and no term match", () => {
    const env = {
      DEPLOY_ARN: "arn:default-role",
      DEPLOY_ARN_production: "arn:prod-role",
    };
    const result = resolveDeployArn(
      "444455556666",
      "my-testing-pipeline",
      null,
      env,
    );
    expect(result).toBe("arn:default-role");
  });

  test("returns empty string when no template, no env vars", () => {
    const env = {};
    const result = resolveDeployArn("444455556666", "my-pipeline", null, env);
    expect(result).toBe("");
  });

  test("returns empty when no template and config is null", () => {
    const env = {};
    const result = resolveDeployArn("444455556666", "pipe", null, env);
    expect(result).toBe("");
  });

  test("skips template when event account is empty", () => {
    const config = {
      deployRoleTemplate: "arn:aws:iam::{account}:role/my-role",
    };
    const env = { DEPLOY_ARN: "arn:fallback" };
    const result = resolveDeployArn("", "my-pipeline", config, env);
    expect(result).toBe("arn:fallback");
  });

  test("skips same-account check when lambdaAccount not provided", () => {
    // Without lambdaAccount, we can't determine if it's the same account,
    // so we proceed to template
    const config = {
      deployRoleTemplate: "arn:aws:iam::{account}:role/my-role",
    };
    const result = resolveDeployArn("111122223333", "pipe", config, {});
    expect(result).toBe("arn:aws:iam::111122223333:role/my-role");
  });

  test("priority: same-account > template > env vars", () => {
    // Same account — should return "" even though template and env vars exist
    const config = {
      deployRoleTemplate: "arn:aws:iam::{account}:role/template-role",
    };
    const env = {
      DEPLOY_ARN: "arn:env-default",
    };
    const result = resolveDeployArn("111122223333", "pipe", config, env, "111122223333");
    expect(result).toBe("");
  });

  test("priority: template > env vars when account differs", () => {
    const config = {
      deployRoleTemplate: "arn:aws:iam::{account}:role/template-role",
    };
    const env = {
      DEPLOY_ARN: "arn:env-default",
    };
    const result = resolveDeployArn("444455556666", "pipe", config, env, "111122223333");
    expect(result).toBe("arn:aws:iam::444455556666:role/template-role");
  });
});

describe("getDeployArnFromEnv (legacy)", () => {
  test("returns matching DEPLOY_ARN_{term} when pipeline name contains term", () => {
    const env = {
      DEPLOY_ARN: "arn:default",
      DEPLOY_ARN_testing: "arn:testing-role",
      DEPLOY_ARN_production: "arn:production-role",
    };
    expect(getDeployArnFromEnv("my-testing-pipeline", env)).toBe(
      "arn:testing-role",
    );
    expect(getDeployArnFromEnv("the-production-app", env)).toBe(
      "arn:production-role",
    );
  });

  test("match is case insensitive", () => {
    const env = {
      DEPLOY_ARN_Testing: "arn:testing-role",
    };
    expect(getDeployArnFromEnv("MY-TESTING-PIPE", env)).toBe(
      "arn:testing-role",
    );
  });

  test("returns DEPLOY_ARN default when no term matches", () => {
    const env = {
      DEPLOY_ARN: "arn:default",
      DEPLOY_ARN_production: "arn:prod",
    };
    expect(getDeployArnFromEnv("my-staging-pipeline", env)).toBe("arn:default");
  });

  test("returns empty string when no DEPLOY_ARN vars exist", () => {
    const env = { OTHER_VAR: "value" };
    expect(getDeployArnFromEnv("my-pipeline", env)).toBe("");
  });

  test("handles multi-word terms with underscores", () => {
    const env = {
      DEPLOY_ARN_real_deal: "arn:real-deal-role",
    };
    expect(getDeployArnFromEnv("the-real_deal-pipeline", env)).toBe(
      "arn:real-deal-role",
    );
  });
});
