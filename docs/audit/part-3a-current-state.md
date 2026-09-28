# Part 3A Forensic Audit: Current Repository State

**Phase**: SAAR PART 3A — Growth Intelligence Foundation  
**Audit Date**: 2026-09-28  
**Auditor**: Principal Engineer + Behavioral Systems Architect + Data/Intelligence Engineer  
**Status**: COMPLETE  

---

## 1. Executive Summary

This forensic audit analyzes the actual running codebase of SAAR across `apps/api`, `apps/worker`, `packages/domain`, `packages/contracts`, and `prisma/schema.prisma` prior to beginning implementation of Part 3A (Growth Intelligence Foundation).

Parts 1 and 2 established the core authentication, tenant isolation, relational data models, behavioral event logging, transactional outbox publishing, background worker jobs, and product workflows (Register, Profile, Future Self, Life Areas, Goals, Metrics, Routines, Tasks, Daily Plans, Check-ins, and Behavior History).

However, **there is currently no real intelligence, feature aggregation, signal computation, or gap detection engine in place**. The system currently stores raw behavioral facts and provides deterministic arithmetic previews in the `DailyGrowthService`, but lacks:
1. Versioned feature extraction (daily/weekly behavioral feature vectors)
2. Signal extraction (consistency, momentum, execution variance, timing patterns, life area balance)
3. Gap Engine comparing desired states (Future Self, Goals) against observed behavior
4. Minimum sample size / confidence thresholding (`NO_DATA`, `INSUFFICIENT_DATA`, `EMERGING_SIGNAL`, `ESTABLISHED_SIGNAL`)
5. Explainable finding generation backed by verifiable factual evidence items

---

## 2. Forensic Inventory of Existing Components

### 2.1 Behavior Events (`apps/api/src/modules/behavior-events/`)
- **Producers**:
  - `TasksService`: emits `task.created`, `task.completed`, `task.skipped`, `task.cancelled`, `task.rescheduled`.
  - `GoalsService`: emits `goal.created`, `goal.updated`, `goal.completed`.
  - `RoutinesService`: emits `routine.completed`, `routine.skipped`, `routine.archived`.
  - `DailyGrowthService`: emits `checkin.completed`, `daily_growth.started`, `daily_growth.completed`.
- **Event Shape**: Stored in `behavior_events` table with:
  `id (UUID)`, `userId`, `eventType`, `occurredAt`, `source`, `entityType`, `entityId`, `metadata (JSONB)`, `schemaVersion (Int)`.
- **Outbox Publishing**: Dual-written atomically to `outbox_events` table in the same DB transaction.
- **Consumer**: `OutboxPublisherService` in `apps/worker` polls with `SELECT FOR UPDATE SKIP LOCKED` and transitions to `PROCESSED` or `DEAD_LETTER`.

### 2.2 Goals & Metric Observations (`apps/api/src/modules/goals/`)
- Goals support `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED` statuses with strict transition matrices.
- `GoalMetric`: models `metricType`, `targetValue`, `currentValue`, `unit`.
- `MetricObservation`: append-only history of quantitative measurements (`value`, `source`, `unit`, `confidence`, `metadata`, `observedAt`).

### 2.3 Tasks (`apps/api/src/modules/tasks/`)
- Rich behavioral fields: `dueAt`, `scheduledAt`, `originalDueAt`, `startedAt`, `completedAt`, `skippedAt`, `rescheduledAt`, `rescheduleCount`, `estimatedMinutes`, `actualDurationMinutes`, `skipReason`, `rescheduleReason`.
- State machine enforced: `TODO`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`, `CANCELLED`, `RESCHEDULED`.
- Strict cross-tenant validation ensuring `goalId`, `lifeAreaId`, and `planId` belong to the same authenticated user.

### 2.4 Routines & Occurrences (`apps/api/src/modules/routines/`)
- `Routine`: RFC 5545 recurrence rule, timezone, preferredTime, active.
- `RoutineOccurrence`: calendar-day bound instances with `[routineId, localDate]` unique constraint, `PENDING`, `COMPLETED`, `SKIPPED`, `MISSED`, `actualDuration`, and `reason`.

### 2.5 Daily Plans (`apps/api/src/modules/plans/`)
- Timezone-aware local date binding (`db.Date`).
- Versioning with `[userId, localDate, version]` unique index and `status` (`ACTIVE`, `SUPERSEDED`, `ARCHIVED`).
- Ordered task priority assignments within plans.

### 2.6 Daily Check-ins (`apps/api/src/modules/daily-growth/`)
- `Checkin`: `[userId, localDate]` unique constraint.
- Captures: `mood` (1-5), `energy` (1-5), `dayRating` (1-5), and qualitative `reflection`.
- Current score: Instant static arithmetic heuristic (50 pts task completion + 25 pts checkin + 25 pts active routines). **Must be superseded by the formal Part 3A Signal & Gap layer.**

### 2.7 Future Self (`apps/api/src/modules/future-self/`)
- Defines `futureIdentity`, `horizonYears`, `desiredStates (JSONB)`, `priorities (JSONB)`, `values (JSONB)`, and `lifeAreaTargets (JSONB)`.
- Currently purely stored and retrieved; never compared against actual behavioral execution.

---

## 3. Gap Analysis: Missing Intelligence Infrastructure

| Required Component | Current State | Required in Part 3A |
|---|---|---|
| **Event Taxonomy & Schema Validation** | Unstructured strings in services | Formal typed catalogue with Zod runtime validators |
| **Daily/Weekly Behavior Aggregator** | Ad-hoc `findMany` queries in `DailyGrowthService` | Dedicated aggregation engine computing execution, consistency, timing, routines, goals, check-ins |
| **Feature Layer** | None | Versioned feature extraction (`task_completion_rate_7d`, `streak`, `variance`, `adherence_14d`, etc.) |
| **Growth Signals** | None | Multi-dimensional signals: Consistency, Momentum, Balance |
| **Gap Engine** | None | Formal comparison of Future Self + Goals vs. observed reality (Quantity, Consistency, Execution, Timing, Priority, Balance gaps) |
| **Confidence & Thresholding** | Missing | Tiered confidence (`NO_DATA`, `INSUFFICIENT_DATA`, `EMERGING_SIGNAL`, `ESTABLISHED_SIGNAL`) based on sample size & recency |
| **Explainable Finding Generator** | None | Human-readable findings strictly backed by factual evidence items |
| **Timezone-aware Aggregation** | Partial (`Intl.DateTimeFormat`) | Full timezone boundary alignment across user local midnight cutoffs |
| **Worker Aggregation Job** | None | Async background aggregator job offloading calculation from API |

---

## 4. Technical Debt & Safety Constraints

1. **No LLM calculation**: LLMs must never calculate user metrics or statistics. Everything must be deterministic pure TypeScript functions in `packages/domain` or modular services.
2. **Historical immutability**: Historical behavior events and metric observations are append-only.
3. **Multi-tenant isolation**: Every aggregation and signal query must strictly scope to `userId`.
4. **Explainability rule**: Never produce an insight or finding without a verifiable array of facts (`evidence: [{ metric, expected, actual, window }]`).

---

## 5. Architectural Blueprint for Part 3A

```text
Packages & Services to construct:

packages/domain/src/
  ├── taxonomy/
  │    └── behavior-taxonomy.ts
  ├── features/
  │    ├── aggregation.types.ts
  │    ├── execution-features.ts
  │    ├── consistency-features.ts
  │    ├── timing-features.ts
  │    └── routine-features.ts
  ├── signals/
  │    ├── signal.types.ts
  │    ├── consistency-signal.ts
  │    ├── momentum-signal.ts
  │    └── balance-signal.ts
  ├── gap/
  │    ├── gap.types.ts
  │    ├── gap-engine.ts
  │    └── confidence.ts
  └── timezone/
       └── local-calendar.ts

apps/api/src/modules/growth-engine/
  ├── growth-engine.module.ts
  ├── growth-engine.controller.ts
  ├── behavior-aggregator.service.ts
  ├── signal-engine.service.ts
  └── gap-engine.service.ts

apps/worker/src/growth-engine/
  └── growth-aggregation-worker.service.ts
```
