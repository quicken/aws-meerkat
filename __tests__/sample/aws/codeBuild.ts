export const SAMPLE_BATCH_BUILDS = {
  builds: [
    {
      id: "meerkat:56be3e40-853a-4797-9455-f88ce291fdad",
      arn: "arn:aws:codebuild:ap-southeast-2:000000000000:build/meerkat:56be3e40-853a-4797-9455-f88ce291fdad",
      buildNumber: 3234,
      startTime: "2022-03-30T18:52:50.170000+10:00",
      endTime: "2022-03-30T19:07:02.944000+10:00",
      currentPhase: "COMPLETED",
      buildStatus: "FAILED",
      sourceVersion: "arn:aws:s3:::project-bucket/meerkat/SourceArti/QS4E7gR",
      resolvedSourceVersion: "87f808edcf4d9a266bcaa5137835a19216418f02",
      projectName: "meerkat",
      phases: [
        {
          phaseType: "SUBMITTED",
          phaseStatus: "SUCCEEDED",
          startTime: "2022-03-30T18:52:50.170000+10:00",
          endTime: "2022-03-30T18:52:50.294000+10:00",
          durationInSeconds: 0,
        },
        {
          phaseType: "QUEUED",
          phaseStatus: "SUCCEEDED",
          startTime: "2022-03-30T18:52:50.294000+10:00",
          endTime: "2022-03-30T18:56:30.198000+10:00",
          durationInSeconds: 219,
        },
        {
          phaseType: "PROVISIONING",
          phaseStatus: "SUCCEEDED",
          startTime: "2022-03-30T18:56:30.198000+10:00",
          endTime: "2022-03-30T18:57:02.518000+10:00",
          durationInSeconds: 32,
          contexts: [
            {
              statusCode: "",
              message: "",
            },
          ],
        },
        {
          phaseType: "DOWNLOAD_SOURCE",
          phaseStatus: "SUCCEEDED",
          startTime: "2022-03-30T18:57:02.518000+10:00",
          endTime: "2022-03-30T18:57:26.049000+10:00",
          durationInSeconds: 23,
          contexts: [
            {
              statusCode: "",
              message: "",
            },
          ],
        },
        {
          phaseType: "INSTALL",
          phaseStatus: "SUCCEEDED",
          startTime: "2022-03-30T18:57:26.049000+10:00",
          endTime: "2022-03-30T18:58:21.929000+10:00",
          durationInSeconds: 55,
          contexts: [
            {
              statusCode: "",
              message: "",
            },
          ],
        },
        {
          phaseType: "PRE_BUILD",
          phaseStatus: "SUCCEEDED",
          startTime: "2022-03-30T18:58:21.929000+10:00",
          endTime: "2022-03-30T19:01:26.405000+10:00",
          durationInSeconds: 184,
          contexts: [
            {
              statusCode: "",
              message: "",
            },
          ],
        },
        {
          phaseType: "BUILD",
          phaseStatus: "FAILED",
          startTime: "2022-03-30T19:01:26.405000+10:00",
          endTime: "2022-03-30T19:07:00.825000+10:00",
          durationInSeconds: 334,
          contexts: [
            {
              statusCode: "COMMAND_EXECUTION_ERROR",
              message:
                "Error while executing command: env REACT_APP_MY_ENVIRONMENT=${MY_ENVIRONMENT} rush build -p 2. Reason: exit status 1",
            },
          ],
        },
        {
          phaseType: "FINALIZING",
          phaseStatus: "SUCCEEDED",
          startTime: "2022-03-30T19:07:00.825000+10:00",
          endTime: "2022-03-30T19:07:02.944000+10:00",
          durationInSeconds: 2,
          contexts: [
            {
              statusCode: "",
              message: "",
            },
          ],
        },
        {
          phaseType: "COMPLETED",
          startTime: "2022-03-30T19:07:02.944000+10:00",
        },
      ],
      source: {
        type: "CODEPIPELINE",
        gitCloneDepth: 1,
        buildspec: "buildspec.yml",
        insecureSsl: false,
      },
      artifacts: {
        location: "arn:aws:s3:::project-bucket/meerkat/BuildArtif/xpXoN6j",
        encryptionDisabled: false,
      },
      cache: {
        type: "LOCAL",
        modes: [
          "LOCAL_SOURCE_CACHE",
          "LOCAL_DOCKER_LAYER_CACHE",
          "LOCAL_CUSTOM_CACHE",
        ],
      },
      environment: {
        type: "LINUX_CONTAINER",
        image: "aws/codebuild/standard:3.0",
        computeType: "BUILD_GENERAL1_LARGE",
        environmentVariables: [
          {
            name: "AWS_ACCOUNT_ID",
            value: "000000000000",
            type: "PLAINTEXT",
          },
          {
            name: "SRC_BUCKET",
            value: "s3://project-bucket",
            type: "PLAINTEXT",
          },
          {
            name: "NEXUSPASSWORD",
            value:
              "arn:aws:secretsmanager:ap-southeast-2:000000000000:secret:mypassword-AAiEPS:NEXUSPASSWORD",
            type: "SECRETS_MANAGER",
          },
          {
            name: "MY_ENVIRONMENT",
            value: "testing",
            type: "PLAINTEXT",
          },
        ],
        privilegedMode: true,
        imagePullCredentialsType: "CODEBUILD",
      },
      serviceRole: "arn:aws:iam::000000000000:role/meerkat-build-service",
      logs: {
        groupName: "/aws/codebuild/meerkat",
        streamName: "56be3e40-853a-4797-9455-f88ce291fdad",
        deepLink:
          "https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#logEvent:group=/aws/codebuild/meerkat;stream=56be3e40-853a-1111-2222-f88ce291fdad",
        cloudWatchLogsArn:
          "arn:aws:logs:ap-southeast-2:000000000000:log-group:/aws/codebuild/meerkat:log-stream:56be3e40-853a-477-3333-f88ce291fdad",
      },
      timeoutInMinutes: 60,
      queuedTimeoutInMinutes: 5,
      buildComplete: true,
      initiator: "codepipeline/meerkat",
      encryptionKey:
        "arn:aws:kms:ap-southeast-2:000000000000:key/aab7ebb2-bb20-42b5-8413-56ad0758e58e",
      fileSystemLocations: [],
    },
  ],
  buildsNotFound: [],
};
