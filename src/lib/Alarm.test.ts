import { Util } from "./Util";

test("parse-sns-alarm-message", async () => {
  const isAlarmMessage = Util.isAlarmMessage(snsAlarmMessage);
  const alert = Util.castToAlarm(snsAlarmMessage);

  expect(isAlarmMessage).toBe(true);
  expect(alert.name).toBe("my-system-lb");
  expect(alert.description).toBe("This is my Alarm");
  expect(alert.reason).toBe(
    "Threshold Crossed: 2 out of the last 2 datapoints [5.535714886726143 (27/09/21 01:36:00), 1.7514244573552422 (27/09/21 01:35:00)] were greater than the threshold (1.0) (minimum 2 datapoints for OK -> ALARM transition)."
  );
  expect(alert.date).toBe(1632706699630);
  expect(alert.type).toBe("alarm");
});

const snsAlarmMessage = {
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
