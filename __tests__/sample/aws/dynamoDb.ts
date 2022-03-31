export const ITEM_FAILED_DEPLOYMENT_PIPE_LOG = {
  Item: {
    isNotified: {
      BOOL: false,
    },
    failed: {
      L: [
        {
          M: {
            name: {
              S: "Deploy-RED",
            },
            summary: {
              S: "Deployment d-A12X8RYMC failed",
            },
            link: {
              S: "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-A12X8RYMC",
            },
            id: {
              S: "d-A12X8RYMC",
            },
            type: {
              S: "deploy",
            },
          },
        },
        {
          M: {
            name: {
              S: "Deploy-GREEN",
            },
            summary: {
              S: "Deployment d-O0GJM3YND failed",
            },
            link: {
              S: "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-O0GJM3YND",
            },
            id: {
              S: "d-O0GJM3YND",
            },
            type: {
              S: "deploy",
            },
          },
        },
        {
          M: {
            name: {
              S: "Deploy-BLUE",
            },
            summary: {
              S: "Deployment d-CHL786YNA failed",
            },
            link: {
              S: "https://console.aws.amazon.com/codedeploy/home?region=ap-southeast-2#/deployments/d-CHL786YNA",
            },
            id: {
              S: "d-CHL786YNA",
            },
            type: {
              S: "deploy",
            },
          },
        },
      ],
    },
    name: {
      S: "meerkat",
    },
    commit: {
      M: {
        summary: {
          S: "DEV-1234: Hide some features so they do not go into release.\n",
        },
        link: {
          S: "https://api.bitbucket.org/2.0/repositories/project/name/commit/f7b0a36de85c68fb17d6bf7a453060e3e1c9da66",
        },
        id: {
          S: "f7b0a36de85c68fb17d6bf7a453060e3e1c9da42",
        },
        author: {
          S: "Marcel Scherzer <spam@spamn.com>",
        },
      },
    },
    executionId: {
      S: "f9b8868d-28b1-4adf-968a-ae8902060662",
    },
  },
};
