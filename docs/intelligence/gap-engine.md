# SAAR Gap Engine Specification (v1.0)

The Gap Engine compares **Desired Intent** against **Observed Reality** to produce structured, actionable findings.

---

## 1. Conceptual Model

```text
       Desired State (Future Self / Goals)
                      vs.
       Observed Behavioral Features (Rolling Windows)
                      =
                 Difference
                      ↓
       Typed Gap (with Confidence & Evidence)
```

---

## 2. Gap Typology

### 1. `QUANTITY_GAP`
- **When**: Stated quantitative target exceeds observed behavioral frequency.
- **Example**: User sets target of 4 workouts/week; actual 14-day average is 2.1 workouts/week.
- **Magnitude**: Absolute deficit ($\Delta = 1.9$).

### 2. `CONSISTENCY_GAP`
- **When**: Stated consistency or routine commitment suffers from high variance or downward trend.
- **Example**: Target adherence 80%; actual 14-day adherence 45%.

### 3. `EXECUTION_GAP`
- **When**: User consistently plans tasks but frequently fails to complete them (high skip/reschedule rates).
- **Formula**: `planned_tasks >= 5` with `completion_rate < 50%` and `reschedule_rate >= 40%`.

### 4. `TIMING_GAP`
- **When**: A task or routine is repeatedly scheduled at a preferred time of day with low completion probability.
- **Example**: Morning routine scheduled at 6:00 AM skipped 5 of last 7 occurrences.

### 5. `PRIORITY_GAP`
- **When**: A goal marked Priority 1 receives a disproportionately low percentage of task/time allocation compared to lower priority goals.

### 6. `BALANCE_GAP`
- **When**: One or two life areas consume $> 75\%$ of planning and execution capacity while other core areas receive $0\%$.

---

## 3. Finding Structure

Every Gap generates a structured finding:

```typescript
export interface GrowthFinding {
  id: string;
  gapType: GapType;
  title: string;
  summary: string;
  areaType?: string;
  goalId?: string;
  magnitude: number;
  confidence: ConfidenceTier;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  evidence: Array<{
    metricName: string;
    expected: number | string;
    actual: number | string;
    windowDays: number;
    unit?: string;
  }>;
  algorithmVersion: string;
  generatedAt: Date;
}
```
