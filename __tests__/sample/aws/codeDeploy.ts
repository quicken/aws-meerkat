export const AWS_LIST_TARGETS = {
  targetIds: ["i-0076ebeb196703200", "i-03ffb163f3a80ec87"],
};

export const AWS_BATCH_TARGETS = {
  deploymentTargets: [
    {
      deploymentTargetType: "InstanceTarget",
      instanceTarget: {
        deploymentId: "d-1H7E9HBQF",
        targetId: "i-03ffb163f3a80ec87",
        targetArn:
          "arn:aws:ec2:ap-southeast-2:000000000000:instance/i-03ffb163f3a80ec87",
        status: "Failed",
        lastUpdatedAt: new Date("2022-03-30T20:00:38.513000+10:00"),
        lifecycleEvents: [
          {
            lifecycleEventName: "BeforeBlockTraffic",
            diagnostics: {
              errorCode: "Success",
              scriptName: "",
              message: "Succeeded",
              logTail: "",
            },
            startTime: new Date("2022-03-30T19:58:54.299000+10:00"),
            endTime: new Date("2022-03-30T19:58:54.392000+10:00"),
            status: "Succeeded",
          },
          {
            lifecycleEventName: "BlockTraffic",
            diagnostics: {
              errorCode: "Success",
              scriptName: "",
              message: "",
              logTail: "",
            },
            startTime: new Date("2022-03-30T19:58:54.858000+10:00"),
            endTime: new Date("2022-03-30T20:00:25.645000+10:00"),
            status: "Succeeded",
          },
          {
            lifecycleEventName: "AfterBlockTraffic",
            diagnostics: {
              errorCode: "Success",
              scriptName: "",
              message: "Succeeded",
              logTail: "",
            },
            startTime: new Date("2022-03-30T20:00:25.716000+10:00"),
            endTime: new Date("2022-03-30T20:00:25.786000+10:00"),
            status: "Succeeded",
          },
          {
            lifecycleEventName: "ApplicationStop",
            diagnostics: {
              errorCode: "Success",
              scriptName: "",
              message: "Succeeded",
              logTail: "",
            },
            startTime: new Date("2022-03-30T20:00:26.760000+10:00"),
            endTime: new Date("2022-03-30T20:00:26.856000+10:00"),
            status: "Succeeded",
          },
          {
            lifecycleEventName: "DownloadBundle",
            diagnostics: {
              errorCode: "Success",
              scriptName: "",
              message: "Succeeded",
              logTail: "",
            },
            startTime: new Date("2022-03-30T20:00:27.837000+10:00"),
            endTime: new Date("2022-03-30T20:00:31.362000+10:00"),
            status: "Succeeded",
          },
          {
            lifecycleEventName: "BeforeInstall",
            diagnostics: {
              errorCode: "Success",
              scriptName: "",
              message: "Succeeded",
              logTail: "",
            },
            startTime: new Date("2022-03-30T20:00:31.435000+10:00"),
            endTime: new Date("2022-03-30T20:00:31.900000+10:00"),
            status: "Succeeded",
          },
          {
            lifecycleEventName: "Install",
            diagnostics: {
              errorCode: "Success",
              scriptName: "",
              message: "Succeeded",
              logTail: "",
            },
            startTime: new Date("2022-03-30T20:00:32.489000+10:00"),
            endTime: new Date("2022-03-30T20:00:33.698000+10:00"),
            status: "Succeeded",
          },
          {
            lifecycleEventName: "AfterInstall",
            diagnostics: {
              errorCode: "ScriptFailed",
              scriptName: "deploy/scripts/flyway_migrate.sh",
              message:
                "Script at specified location: deploy/scripts/awesome.sh run as user root failed with exit code 1",
              logTail:
                "[stderr]\t\t\t\tOR cdate.complexDate <= logzAtt.LogEntryDate\n[stderr]\t\t\t)\n[stderr]\t\t\tGROUP BY datAtt.systemlID, attnd.animalID\n[stderr]\t\t) as systemAttendance ON ce.systemlID = systemAttendance.systemlID\n[stderr]\n[stderr]\t\tLEFT JOIN (\n[stderr]\t\t\tSELECT systemlID, Count(complexID) as expSessionCountEnr, SUM(cdDurationMinutes) as expDurationMinutesEnr\n[stderr]\t\t\tFROM REPORTING_Alias_Distinct_Enrol_ComplexID\n[stderr]\t\t\tGROUP BY systemlID\n[stderr]\t\t) as expected ON ce.systemlID = expected.systemlID\n[stderr]\n[stderr]\t\tLEFT JOIN REPORTING_ALIAS_AuditLastUpdate as unitLog ON ce.systemlID = unitLog.systemlID\n[stderr]\n[stderr]\t\tLEFT JOIN REPORTING_ALIAS_StatusLogLastUpdate lastStatusLog ON ce.systemlID = lastStatusLog.fksystemlID\n[stderr]\t\tLEFT JOIN StatusLog LLog ON lastStatusLog.statusLogID = LLog.statusLogID\n[stderr]\n[stderr]\t\tLEFT JOIN (\n[stderr]\t\t\tselect MAX(lm.metaValue) as userID, l.animalID\n[stderr]\t\t\tfrom learnerMeta lm\n[stderr]\t\t\tinner join learner l on l.learnerID = lm.learnerID\n[stderr]\t\t\twhere lm.metaKey = 'UserID'\n[stderr]\t\t\tGROUP BY animalID\n[stderr]\t\t) as moodle on moodle.animalID = vm.animalID\n[stderr]\n[stderr]\t\tLEFT JOIN (\n[stderr]\t\t\tSELECT ce2.systemlID, ROW_NUMBER() OVER (PARTITION BY ceg.enrolmentGroupID ORDER BY coalesce(ce2.dateCommenced, ce2.dateEnrolled)) AS groupIndex\n[stderr]\t\t\tFROM rto_classEnrollees ce2\n[stderr]\t\t\t\tJOIN tGroup ceg on ce2.fkEnrolmentGroupID = ceg.enrolmentGroupID\n[stderr]\t\t\t) grp on grp.systemlID = ce.systemlID\n[stderr]\n[stderr]\t\tLEFT JOIN (\n[stderr]\t\t\tSELECT COUNT(lme.moduleEnrolmentID) as numModulesCompleted, lme.systemlID\n[stderr]\t\t\tFROM LearningModuleEnrolments lme\n[stderr]\t\t\tWHERE lme.statusID = 3\n[stderr]\t\t\tGROUP BY lme.systemlID\n[stderr]\t\t) as learningModules ON lme.systemlID = ce.systemlID\n[stderr]\n[stderr]\n[stderr]\r\n[stderr]Caused by: com.microsoft.sqlserver.jdbc.SQLServerException: The multi-part identifier \"lme.systemlID\" could not be bound.\n",
            },
            startTime: new Date("2022-03-30T20:00:33.750000+10:00"),
            endTime: new Date("2022-03-30T20:00:37.999000+10:00"),
            status: "Failed",
          },
          {
            lifecycleEventName: "ApplicationStart",
            status: "Skipped",
          },
          {
            lifecycleEventName: "ValidateService",
            status: "Skipped",
          },
          {
            lifecycleEventName: "BeforeAllowTraffic",
            status: "Skipped",
          },
          {
            lifecycleEventName: "AllowTraffic",
            status: "Skipped",
          },
          {
            lifecycleEventName: "AfterAllowTraffic",
            status: "Skipped",
          },
        ],
      },
    },
    {
      deploymentTargetType: "InstanceTarget",
      instanceTarget: {
        deploymentId: "d-1H7E9HBQF",
        targetId: "i-0076ebeb196703200",
        targetArn:
          "arn:aws:ec2:ap-southeast-2:000000000000:instance/i-0076ebeb196703200",
        status: "Skipped",
        lastUpdatedAt: new Date("2022-03-30T20:00:39.697000+10:00"),
        lifecycleEvents: [
          {
            lifecycleEventName: "BeforeBlockTraffic",
            status: "Skipped",
          },
          {
            lifecycleEventName: "BlockTraffic",
            status: "Skipped",
          },
          {
            lifecycleEventName: "AfterBlockTraffic",
            status: "Skipped",
          },
          {
            lifecycleEventName: "ApplicationStop",
            status: "Skipped",
          },
          {
            lifecycleEventName: "DownloadBundle",
            status: "Skipped",
          },
          {
            lifecycleEventName: "BeforeInstall",
            status: "Skipped",
          },
          {
            lifecycleEventName: "Install",
            status: "Skipped",
          },
          {
            lifecycleEventName: "AfterInstall",
            status: "Skipped",
          },
          {
            lifecycleEventName: "ApplicationStart",
            status: "Skipped",
          },
          {
            lifecycleEventName: "ValidateService",
            status: "Skipped",
          },
          {
            lifecycleEventName: "BeforeAllowTraffic",
            status: "Skipped",
          },
          {
            lifecycleEventName: "AllowTraffic",
            status: "Skipped",
          },
          {
            lifecycleEventName: "AfterAllowTraffic",
            status: "Skipped",
          },
        ],
      },
    },
  ],
};
