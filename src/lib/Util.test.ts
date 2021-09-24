import "dotenv/config";
import { Util } from "./Util";
process.env;
test("deploy_arn_env_filters", async () => {
  const mock = {
    DEPLOY_ARN: "arn:default",
    DEPLOY_ARN_testing_env: "arn:testing",
    DEPLOY_ARN_ProducTion: "arn:production",
  };

  expect(Util.getDeployArnFromEnv("some_non_matching", mock)).toBe(
    "arn:default"
  );

  expect(Util.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)).toBe(
    "arn:testing"
  );

  expect(Util.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe(
    "arn:default"
  );

  expect(Util.getDeployArnFromEnv("production_matching", mock)).toBe(
    "arn:production"
  );
});

test("deploy_arn_no_default", async () => {
  const mock = {
    DEPLOY_ARN_testing_env: "arn:testing",
    DEPLOY_ARN_ProducTion: "arn:production",
  };

  expect(Util.getDeployArnFromEnv("some_non_matching", mock)).toBe("");

  expect(Util.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)).toBe(
    "arn:testing"
  );

  expect(Util.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe("");

  expect(Util.getDeployArnFromEnv("production_matching", mock)).toBe(
    "arn:production"
  );
});

test("default_only", async () => {
  const mock = {
    DEPLOY_ARN: "arn:testing",
  };

  expect(Util.getDeployArnFromEnv("some_non_matching", mock)).toBe(
    "arn:testing"
  );

  expect(Util.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)).toBe(
    "arn:testing"
  );

  expect(Util.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe(
    "arn:testing"
  );

  expect(Util.getDeployArnFromEnv("production_matching", mock)).toBe(
    "arn:testing"
  );
});

test("missing_opt", async () => {
  const mock = {
    FOO: "Bar",
  };

  expect(Util.getDeployArnFromEnv("some_non_matching", mock)).toBe("");

  expect(Util.getDeployArnFromEnv("unit_pipe_testing_env_foo", mock)).toBe("");

  expect(Util.getDeployArnFromEnv("unit_pipe_testing", mock)).toBe("");

  expect(Util.getDeployArnFromEnv("production_matching", mock)).toBe("");
});
