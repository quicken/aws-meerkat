import "dotenv/config";

test("mock-test", async () => {
  expect(true).toBe(true);
});

export const SNS_ALARM_MESSAGE = {
  AlarmName: "my-system-lb",
  AlarmDescription: "This is my Alarm",
  AWSAccountId: "111111111111",
  NewStateValue: "ALARM",
  NewStateReason:
    "Threshold Crossed: 2 out of the last 2 datapoints [5.535714886726143 (27/09/21 01:36:00), 1.7514244573552422 (27/09/21 01:35:00)] were greater than the threshold (1.0) (minimum 2 datapoints for OK -> ALARM transition).",
  StateChangeTime: "2021-09-27T01:38:19.630+0000",
  Region: "Asia Pacific (Sydney)",
  AlarmArn: "arn:aws:cloudwatch:ap-southeast-2:111111111111:alarm:lb-latency",
  OldStateValue: "OK",
  Trigger: {
    MetricName: "TargetResponseTime",
    Namespace: "AWS/ApplicationELB",
    StatisticType: "Statistic",
    Statistic: "AVERAGE",
    Unit: null,
    Dimensions: [{ value: "app/lb/12343464af00accc", name: "LoadBalancer" }],
    Period: 60,
    EvaluationPeriods: 2,
    ComparisonOperator: "GreaterThanThreshold",
    Threshold: 1.0,
    TreatMissingData: "- TreatMissingData: missing",
    EvaluateLowSampleCountPercentile: "",
  },
};

/**
 * An example payload received in the response body as a result of calling the Bitbucket API to receive a specific commit.
 */
export const BITBUCKET_GET_COMMIT_RESPONSE = {
  rendered: {
    message: {
      raw: "Custom verification link for NLE\n\nRequires a matching lambda function\n",
      markup: "markdown",
      html: '<p><a href="https://project.atlassian.net/browse/DEV-666" class="ap-connect-link" rel="nofollow">DEV-666</a> - Custom verification link for NLE</p>\n<p>Requires a matching lambda function</p>',
      type: "rendered",
    },
  },
  hash: "3fcdaa5ac3e29c79008319ede6c092643f204af0",
  repository: {
    links: {
      self: {
        href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject",
      },
      html: {
        href: "https://bitbucket.org/yourcompany/yourproject",
      },
      avatar: {
        href: "https://bytebucket.org/ravatar/%7B7ee2d262-f10c-486c-b0f8-8a5e1cfde891%7D?ts=1278003",
      },
    },
    type: "repository",
    name: "yourproject",
    full_name: "yourcompany/yourproject",
    uuid: "{7ee2d262-f10c-486c-b0f8-8a5e1cfde891}",
  },
  links: {
    self: {
      href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/commit/3fcdaa5ac3e29c79008319ede6c092643f204af0",
    },
    comments: {
      href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/commit/3fcdaa5ac3e29c79008319ede6c092643f204af0/comments",
    },
    patch: {
      href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/patch/3fcdaa5ac3e29c79008319ede6c092643f204af0",
    },
    html: {
      href: "https://bitbucket.org/yourcompany/yourproject/commits/3fcdaa5ac3e29c79008319ede6c092643f204af0",
    },
    diff: {
      href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/diff/3fcdaa5ac3e29c79008319ede6c092643f204af0",
    },
    approve: {
      href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/commit/3fcdaa5ac3e29c79008319ede6c092643f204af0/approve",
    },
    statuses: {
      href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/commit/3fcdaa5ac3e29c79008319ede6c092643f204af0/statuses",
    },
  },
  author: {
    raw: "Marcel Scherzet <mscherzer@gmail.com>",
    type: "author",
    user: {
      display_name: "Marcel Scherzet",
      uuid: "{a2d5d0fc-2135-4e35-90bd-b507eb9743c5}",
      links: {
        self: {
          href: "https://api.bitbucket.org/2.0/users/%7Ba2d5d0fc-2135-4e35-90bd-b507eb9743c5%7D",
        },
        html: {
          href: "https://bitbucket.org/%7Ba2d5d0fc-2135-4e35-90bd-b507eb9743c5%7D/",
        },
        avatar: {
          href: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:a801d9e9-be35-4626-84df-f00aba84ac96/a12624ff-84e3-4366-9e1d-af6ec94a4dda/128",
        },
      },
      type: "user",
      nickname: "Marcel Scherzet",
      account_id: "557058:a801d9e9-be35-4626-84df-f00aba84ac96",
    },
  },
  summary: {
    raw: "DEV-666 - Custom verification link for NLE\n\nRequires a matching lambda function\n",
    markup: "markdown",
    html: '<p><a href="https://yourproject.atlassian.net/browse/DEV-666" class="ap-connect-link" rel="nofollow">DEV-666</a> - Custom verification link for NLE</p>\n<p>Requires a matching lambda function</p>',
    type: "rendered",
  },
  participants: [],
  parents: [
    {
      hash: "cb008bc3921a3e2ccdce297f6c9b0bc106339b9f",
      type: "commit",
      links: {
        self: {
          href: "https://api.bitbucket.org/2.0/repositories/yourcompany/yourproject/commit/cb008bc3921a3e2ccdce297f6c9b0bc106339b9f",
        },
        html: {
          href: "https://bitbucket.org/yourcompany/yourproject/commits/cb008bc3921a3e2ccdce297f6c9b0bc106339b9f",
        },
      },
    },
  ],
  date: "2021-09-23T07:00:32+00:00",
  message:
    "DEV-666 - Custom verification link for NLE\n\nRequires a matching lambda function\n",
  type: "commit",
};

/**
 * An example payload received in the response body as a result of calling the GitHub REST API to receive a specific commit.
 */
export const GITHUB_GET_COMMIT_RESPONSE = {
  sha: "f7ec85262da48e2b15d03037b138963c5a89d39f",
  node_id:
    "C_kwDOGGMBnNoAKGY3ZWM4NTI2MmRhNDhlMmIxNWQwMzAzN2IxMzg5NjNjNWE4OWQzOWY",
  url: "https://api.github.com/repos/quicken/aws-meerkat/git/commits/f7ec85262da48e2b15d03037b138963c5a89d39f",
  html_url:
    "https://github.com/quicken/aws-meerkat/commit/f7ec85262da48e2b15d03037b138963c5a89d39f",
  author: {
    name: "marcel",
    email: "mscherzer@gmail.com",
    date: "2021-09-25T06:11:18Z",
  },
  committer: {
    name: "marcel",
    email: "mscherzer@gmail.com",
    date: "2021-09-25T06:11:18Z",
  },
  tree: {
    sha: "68f380f23a8d9eacde1d6689b435c604ac2a9676",
    url: "https://api.github.com/repos/quicken/aws-meerkat/git/trees/68f380f23a8d9eacde1d6689b435c604ac2a9676",
  },
  message:
    "The example pipeline now also creates the notification rules expected by\n" +
    "the pipeline monitor.",
  parents: [[Object]],
  verification: {
    verified: false,
    reason: "unsigned",
    signature: null,
    payload: null,
  },
};

export const AWS_CODE_DEPLOY_INFO = {
  deploymentInfo: {
    applicationName: "meerkat",
    deploymentGroupName: "CodeDeployGroup-16R8607X8JSY5",
    deploymentConfigName: "CodeDeployDefault.HalfAtATime",
    deploymentId: "d-2H7E9HBRG",
    previousRevision: {
      revisionType: "S3",
      s3Location: {
        bucket: "meerkat-artifact",
        key: "meerkat/BuildArtif/y38gNdK",
        bundleType: "zip",
        eTag: "8f88669d76c2f58eb1c3341f6c6fb334-16",
      },
    },
    revision: {
      revisionType: "S3",
      s3Location: {
        bucket: "meerkat-artifact",
        key: "meerkat/BuildArtif/gl5FWHX",
        bundleType: "zip",
        eTag: "42717b56516bc706613f7ed5a00634b4-16",
      },
    },
    status: "Failed",
    errorInformation: {
      code: "HEALTH_CONSTRAINTS",
      message:
        "The overall deployment failed because too many individual instances failed deployment, too few healthy instances are available for deployment, or some instances in your deployment group are experiencing problems.",
    },
    createTime: "2022-03-30T19:58:51.009000+10:00",
    completeTime: "2022-03-30T20:00:39.793000+10:00",
    deploymentOverview: {
      Pending: 0,
      InProgress: 0,
      Succeeded: 0,
      Failed: 1,
      Skipped: 1,
      Ready: 0,
    },
    creator: "user",
    ignoreApplicationStopFailures: false,
    updateOutdatedInstancesOnly: false,
    rollbackInfo: {},
    deploymentStyle: {
      deploymentType: "IN_PLACE",
      deploymentOption: "WITH_TRAFFIC_CONTROL",
    },
    instanceTerminationWaitTimeStarted: false,
    loadBalancerInfo: {
      targetGroupInfoList: [
        {
          name: "meerkat",
        },
      ],
    },
    fileExistsBehavior: "DISALLOW",
    deploymentStatusMessages: [],
    computePlatform: "Server",
  },
};

export const AWS_MANUAL_APPROVAL_REQUEST_INFO = {
  account: "483376129420",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-04-13T00:02:16Z",
  notificationRuleArn: "arn:aws:codestar-notifications:ap-southeast-2:483376129420:notificationrule/06486c59533a1ace24d910539fc74bd351ff13e4",
  detail: {
    pipeline: "lena-test-pipeline",
    'execution-id': "31c2dcbd-2a1d-42b0-9f37-5bf8cb693b28",
    stage: "ManualApproval",
    action: "Approval",
    state: "STARTED",
    region: "ap-southeast-2",
    type: {
      owner: "AWS",
      provider: "Manual",
      category: "Approval",
      version: "1"
    },
    version: 2
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:483376129420:lena-test-pipeline"
  ],
  additionalAttributes: {
    externalEntityLink: "",
    customData: ""
  }
}

export const AWS_MANUAL_REQUEST_APPROVED = {
  account: "483376129420",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-04-13T00:05:40Z",
  notificationRuleArn: "arn:aws:codestar-notifications:ap-southeast-2:483376129420:notificationrule/06486c59533a1ace24d910539fc74bd351ff13e4",
  detail: {
    pipeline: "lena-test-pipeline",
    'execution-id': "31c2dcbd-2a1d-42b0-9f37-5bf8cb693b28",
    stage: "ManualApproval",
    'execution-result': {
      'external-execution-summary': "Approved by arn:aws:sts::483376129420:assumed-role/ax-devops-developer-tier-1/lena",
      'external-execution-id': "7c24df87-e753-4d28-bb04-d48acd0e6cb3"
    },
    action: "Approval",
    state: "SUCCEEDED",
    region: "ap-southeast-2",
    type: {
      owner: "AWS",
      provider: "Manual",
      category: "Approval",
      version: "1"
    },
    version: 2
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:483376129420:lena-test-pipeline"
  ],
  additionalAttributes: {}
}

export const AWS_MANUAL_REQUEST_REJECTED = {
  account: "483376129420",
  detailType: "CodePipeline Action Execution State Change",
  region: "ap-southeast-2",
  source: "aws.codepipeline",
  time: "2022-04-13T00:03:25Z",
  notificationRuleArn: "arn:aws:codestar-notifications:ap-southeast-2:483376129420:notificationrule/06486c59533a1ace24d910539fc74bd351ff13e4",
  detail: {
    'pipeline': "lena-test-pipeline",
    'execution-id': "31c2dcbd-2a1d-42b0-9f37-5bf8cb693b28",
    stage: "ManualApproval",
    'execution-result': {
      'external-execution-summary': "test rejection message",
      'external-execution-id': "08ad9fe7-6774-4aa8-ba98-1e9707045004",
      'error-code': "JobFailed"
    },
    action: "Approval",
    state: "FAILED",
    region: "ap-southeast-2",
    type: {
      owner: "AWS",
      provider: "Manual",
      category: "Approval",
      version: "1"
    },
    version: 2
  },
  resources: [
    "arn:aws:codepipeline:ap-southeast-2:483376129420:lena-test-pipeline"
  ],
  additionalAttributes: {}
}