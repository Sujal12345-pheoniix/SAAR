# SAAR Canonical Adaptation Rules Catalogue

**Module**: Adaptive Engine Rules  
**Version**: `1.0.0`  
**Standard**: Every rule defines Input, Condition, Output, Reason, Confidence, Failure case, and Version.  

---

## 1. Overview

Adaptation rules in SAAR are **deterministic behavioral logic gates**. They inspect aggregated telemetry, capacity constraints, and historical friction patterns to generate candidate interventions and schedule adaptations.

Rules **never** assume psychological intent or produce arbitrary scores. They are explainable hypotheses proposed to the user for decision-making.

---

## 2. Canonical Adaptation Rules Catalogue

### Rule ADAPT-001: Monolithic Task Friction (Split Task)
- **Input**: Task execution history, `task.rescheduledAt`, `task.rescheduleCount`, `task.estimatedMinutes`.
- **Condition**: `task.rescheduleCount >= 2` AND `task.status !== 'COMPLETED'` AND `task.estimatedMinutes >= 60`.
- **Output**: Intervention of type `SPLIT_TASK` proposing division into 2 or 3 smaller micro-tasks of 20–30 minutes each.
- **Reason**: Monolithic tasks exceeding 60 minutes create high initiation friction; breaking them into concrete sub-actions lowers mental threshold.
- **Confidence**: `ESTABLISHED_SIGNAL` if observed across $\ge 2$ reschedule events; otherwise `EMERGING_SIGNAL`.
- **Failure Case**: If user repeatedly postpones due to external blockers rather than task size. (Mitigation: include option to flag external dependency).
- **Version**: `1.0.0`

---

### Rule ADAPT-002: Repeated Time-Window Mismatch (Move Time)
- **Input**: Completed and skipped tasks partitioned by scheduled time window (Morning $06-12$, Afternoon $12-17$, Evening $17-22$).
- **Condition**: Specific task category completion rate in current window $< 35\%$ with sample size $\ge 4$, while an alternative window shows completion rate $\ge 70\%$ with sample size $\ge 4$.
- **Output**: Intervention of type `MOVE_TIME` proposing moving task to the high-completion window.
- **Reason**: Behavioral history indicates natural schedule or energy compatibility is significantly higher in the proposed window.
- **Confidence**: `ESTABLISHED_SIGNAL` ($\ge 4$ observations per window).
- **Failure Case**: User has an external non-negotiable conflict in the proposed window not visible in SAAR. (Mitigation: user can dismiss with reason).
- **Version**: `1.0.0`

---

### Rule ADAPT-003: Chronic Over-Planning & Friction (Reduce Scope / Load)
- **Input**: 7-day rolling `ExecutionFeatures` (`completionRate`, `tasksPlanned`, `frictionScore`).
- **Condition**: `tasksPlanned >= 5` daily average AND `completionRate < 50%` AND `frictionScore >= 40%`.
- **Output**: Intervention of type `REDUCE_SCOPE` capping tomorrow's planned task limit to at most 3 high-priority tasks.
- **Reason**: Chronic over-planning causes failure cascades where missed tasks induce fatigue and subsequent postponement.
- **Confidence**: `ESTABLISHED_SIGNAL` (7 days of multi-task planning data).
- **Failure Case**: Urgent temporary project requires high volume despite low completion. (Mitigation: user can override capacity cap).
- **Version**: `1.0.0`

---

### Rule ADAPT-004: Buffer Deficit & Schedule Collisions (Add Buffer)
- **Input**: Tomorrow's planned tasks, routine occurrences, start and end times, user timezone.
- **Condition**: Two or more consecutive scheduled items have $< 10$ minutes gap between scheduled completion and next start.
- **Output**: Schedule adaptation proposing `ADD_BUFFER` inserting 15-minute transition gaps between consecutive activities.
- **Reason**: Zero-buffer scheduling fails upon minor variance, causing cascading delays throughout the remainder of the day.
- **Confidence**: `ESTABLISHED_SIGNAL` (deterministic schedule overlap).
- **Failure Case**: User deliberately batches micro-tasks together. (Mitigation: apply buffer rule only between tasks with duration $\ge 25$ mins).
- **Version**: `1.0.0`

---

### Rule ADAPT-005: Habit Stagnation / Broken Streak (Restore Routine)
- **Input**: 14-day `RoutineFeatures`, `RoutineOccurrence` statuses (`MISSED`, `SKIPPED`).
- **Condition**: Active routine adherence rate $< 40\%$ over 14 days OR routine streak broken for $\ge 3$ consecutive occurrences.
- **Output**: Intervention of type `RESTORE_ROUTINE` offering temporary reduction in routine target frequency or reminder time adjustment.
- **Reason**: When a routine becomes dormant, re-anchoring at minimal viable friction restores habit continuity better than strict compliance.
- **Confidence**: `ESTABLISHED_SIGNAL` (14 days of routine occurrence logs).
- **Failure Case**: User intentionally paused routine due to illness or vacation. (Mitigation: allow user to select 'Rest / Vacation' mode).
- **Version**: `1.0.0`

---

### Rule ADAPT-006: High Priority Goal Neglect (Priority Re-alignment)
- **Input**: Active goals with `priority == 1`, 14-day task completion history mapped to `goalId`.
- **Condition**: Priority 1 goal has 0 completed tasks within the past 14 days, while lower priority goals have $> 5$ completions.
- **Output**: Intervention of type `CREATE_SMALLER_STEP` proposing a 15-minute starter action for tomorrow's plan mapped directly to the Priority 1 goal.
- **Reason**: Divergence between declared priority (Priority 1) and actual behavioral investment indicates priority evasion or friction.
- **Confidence**: `ESTABLISHED_SIGNAL` (zero completions across 14 full days).
- **Failure Case**: Goal is awaiting external deliverables (e.g. waiting for legal feedback). (Mitigation: prompt user for goal status review).
- **Version**: `1.0.0`

---

### Rule ADAPT-007: Lifestyle Over-Concentration (Balance Adjustment)
- **Input**: 14-day `LifeAreaFeatures` (`distributions`, `entropyScore`, `topAreaType`).
- **Condition**: `topAreaType` accounts for $\ge 75\%$ of all completed activity minutes AND `entropyScore < 0.60`.
- **Output**: Trade-off alert and candidate recommendation in the most neglected life area with lowest percentage.
- **Reason**: Excessive concentration in a single life area produces cross-area strain, neglecting health or relationships.
- **Confidence**: `ESTABLISHED_SIGNAL` (sample size $\ge 10$ tasks across 14 days).
- **Failure Case**: Seasonal intense sprint (e.g. exam week or startup launch). (Mitigation: flag as temporary surge).
- **Version**: `1.0.0`

---

### Rule ADAPT-008: Low Wellbeing & High Workload (Rest / Recovery Buffer)
- **Input**: 3-day rolling `Checkin` history (`mood`, `energy`, `dayRating`), scheduled tomorrow tasks.
- **Condition**: Average `mood <= 2` AND average `energy <= 2` across last 3 days AND tomorrow planned duration $\ge 240$ minutes.
- **Output**: Intervention of type `REFLECT` and recommended 60-minute reduction in tomorrow's elective task workload.
- **Reason**: Sustained low energy coupled with aggressive scheduling triggers burn-out and sharp declines in subsequent weekly consistency.
- **Confidence**: `EMERGING_SIGNAL` (3 consecutive days of check-in data).
- **Failure Case**: Low energy due to temporary illness rather than schedule overload. (Mitigation: suggestions focus on rest and recovery).
- **Version**: `1.0.0`
