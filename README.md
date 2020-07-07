# Downtime Pareto

| Libre Panel for Pareto Analysis of Downtime Reason Codes

Custom Drill-Down Bar/Pareto Chart Plugin that visualises the Reason Codes Data showing what category and reason happened for how many times (in frequency mode) or what category and reason took how much time (in duration mode).

------

## Influxdb Query example

```influxdb
SELECT
  "Site"
  ,"Area"
  ,"Line"
  ,"duration"
  ,"durationInt"
  ,"execute"
  ,"held"
  ,"idle"
  ,"stopped"
  ,"complete"
  ,"category"
  ,"reason"
  ,"comment"
  ,"parentReason"
FROM "Availability"
WHERE $timeFilter
```

## Data format

Data MUST be formatted as a TABLE
