# SAAR Adaptive Scheduling & Simulation Architecture

**Module**: Adaptive Scheduling Engine  
**Version**: `1.0.0`  
**Classification**: Pure Deterministic Scheduling & Simulation System  

---

## 1. Objectives

1. **Capacity-Aware Placement**: Never schedule tasks beyond realistic biological and time constraints.
2. **Behavioral Compatibility (Circadian & Empirical)**: Position activities in time windows where the user historically completes them.
3. **Simulation Before Mutation**: Present clear side-by-side diffs (`Current Plan` vs `Proposed Plan`) before applying schedule changes.
4. **Preserve User Autonomy**: The engine proposes and simulates; the user accepts or modifies.

---

## 2. Schedule Capacity Model

The daily calendar is divided into discrete time blocks or dynamic windows:
- **Morning Window** ($06:00 - 12:00$)
- **Afternoon Window** ($12:00 - 17:00$)
- **Evening Window** ($17:00 - 22:00$)
- **Night / Sleep Window** ($22:00 - 06:00$)

### Usable Discretionary Capacity
Not all open minutes are usable. The engine factors in:
1. **Transition Overhead**: Every distinct task requires a 10-15 minute transition buffer.
2. **Cognitive Fatigue Threshold**: No more than 180 continuous minutes of HIGH energy demand tasks.
3. **Routine Anchor Protection**: Routine windows are treated as immutable anchors unless the user explicitly requests routine restructuring.

---

## 3. Empirical Compatibility Modeling

The system analyzes completed vs. skipped/rescheduled tasks partitioned by the hour of day they were scheduled:

$$\text{Compatibility}(W_i, \text{Category}) = \frac{\text{Completed Tasks in } W_i}{\text{Total Scheduled Tasks in } W_i}$$

### Rules of Interpretation
- **Empirical Correlation, NOT Biological Absolutes**: If a user completes 25% of morning workouts and 78% of evening workouts, the system notes:
  > *"Your completion rate for workouts has been 78% in the evening (17:00-20:00) vs 25% in the morning (06:00-09:00)."*
- **Sufficient Data Threshold**: Compatibility scoring requires at least 4 observations in a given window; otherwise, default neutral compatibility ($0.50$) is applied with `EMERGING_SIGNAL` or `INSUFFICIENT_DATA`.

---

## 4. Multi-Factor Candidate Ranking Algorithm

When selecting which tasks or activities to schedule into a plan, candidates are ranked deterministically:

$$\text{CandidateScore} = \sum_{k} w_k \cdot f_k$$

Where factors $f_k \in [0, 1]$ and weights $w_k$ sum to $1.0$:

| Dimension | Weight | Description | Calculation |
|---|---|---|---|
| **Goal Relevance ($f_{goal}$)** | $0.25$ | Importance of parent goal | Priority 1 = 1.0, Priority 2 = 0.8, Priority 3 = 0.6, Non-goal = 0.2 |
| **Urgency / Deadline ($f_{urgency}$)** | $0.25$ | Proximity to due date | Due today = 1.0, Due within 48h = 0.8, Due within 7d = 0.5 |
| **Time Compatibility ($f_{compat}$)** | $0.20$ | Empirical completion rate in window | Observed historical completion rate in matching time block |
| **Life Area Balance ($f_{balance}$)** | $0.15$ | Underrepresented life area boost | Inverse allocation: area with lowest weekly % receives higher weight |
| **Friction History ($f_{friction}$)** | $0.15$ | High reschedule count penalty | $\max(0, 1.0 - 0.2 \cdot \text{rescheduleCount})$ |

Every candidate ranking includes an **auditable breakdown** explaining the exact sub-scores.

---

## 5. Schedule Simulation Contract

Before any plan is mutated, the scheduling engine generates a `ScheduleSimulationResult`:

```typescript
export interface ScheduleDiff {
  tasksMoved: Array<{ taskId: string; fromTime: string; toTime: string; reason: string }>;
  tasksDelayed: Array<{ taskId: string; originalDate: string; newDate: string }>;
  tasksAdded: Array<{ taskId: string; title: string; scheduledAt: string }>;
  tasksRemoved: Array<{ taskId: string; title: string; reason: string }>;
  conflictsCreated: string[];
  conflictsResolved: string[];
  netDurationMinutesDelta: number;
}

export interface ScheduleSimulationResult {
  currentPlanVersion: number;
  proposedPlanVersion: number;
  diff: ScheduleDiff;
  feasibilityScore: number; // 0-100
  summary: string;
}
```

The user receives the full visual and structured diff. If accepted, the plan transitions from version $V$ to $V+1$, superseding the prior plan transactionally.
