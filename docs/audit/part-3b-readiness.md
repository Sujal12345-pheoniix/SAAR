# SAAR Part 3B Readiness Audit

**Phase**: Preparation for Part 3B — Adaptive Growth Engine  
**Date**: 2026-09-28  
**Auditor**: Principal Engineer + Behavioral Systems Architect

---

## 1. Verification of Part 3A Foundation

| Subsystem | Verified File / Location | Status | Observations / Findings |
|---|---|---|---|
| **Gap Engine** | `packages/domain/src/gap/` & `apps/api/src/modules/growth-engine/gap-engine.service.ts` | **READY** | Implements deterministic detection for 5 canonical gaps: `QUANTITY_GAP`, `CONSISTENCY_GAP`, `EXECUTION_GAP`, `PRIORITY_GAP`, `BALANCE_GAP`. Persists findings with versioning to `Insight` table. |
| **Feature Layer** | `packages/domain/src/features/` & `apps/api/src/modules/growth-engine/behavior-aggregator.service.ts` | **READY** | Extracts rolling 7d, 14d, 30d feature vectors: `ExecutionFeatures`, `ConsistencyFeatures`, `RoutineFeatures`, `WellBeingFeatures`, `LifeAreaFeatures`. |
| **Signals Layer** | `packages/domain/src/signals/` & `apps/api/src/modules/growth-engine/signal-engine.service.ts` | **READY** | Evaluates Consistency, Momentum (velocity delta), and Balance (Shannon entropy across life areas). |
| **Event Taxonomy** | `packages/domain/src/taxonomy/behavior-taxonomy.ts` & `packages/contracts/src/events/index.ts` | **PARTIAL DEFECT** | Existing taxonomy covers task, routine, checkin, and daily growth lifecycle. Missing: `gap.detected`, `intervention.proposed`, `intervention.rejected`, `schedule.adaptation_proposed`, `schedule.adaptation_accepted`. |
| **Metric Observations** | `prisma/schema.prisma` (`MetricObservation`) | **READY** | Models numeric measurements with observedAt, source, and confidence. |
| **Aggregation & Timezones** | `packages/domain/src/calendar/local-calendar.ts` | **READY** | Local calendar midnight projections powered by `Intl.DateTimeFormat` across user-configured IANA timezones. |
| **Confidence Model** | `packages/domain/src/features/feature-extractors.ts` | **READY** | 4-tier data density classification (`NO_DATA`, `LOW_DATA`, `EMERGING_SIGNAL`, `ESTABLISHED_SIGNAL`). |
| **Task History** | `prisma/schema.prisma` (`Task`) | **READY** | Tracks `rescheduleCount`, `rescheduledAt`, `skippedAt`, `skipReason`, `actualDurationMinutes`, `priority`. |
| **Routine Occurrences** | `prisma/schema.prisma` (`RoutineOccurrence`) | **READY** | Stores user-local date occurrences with idempotency index `[routineId, localDate]`. |
| **Plan Versioning** | `prisma/schema.prisma` (`Plan`) | **READY** | Stores daily plans with unique compound index `[userId, localDate, version]` and `ACTIVE`/`SUPERSEDED` statuses. |
| **Outbox & Workers** | `prisma/schema.prisma` (`OutboxEvent`) & `apps/worker` | **READY** | Outbox publisher handles transactional events with `SELECT FOR UPDATE SKIP LOCKED` and exponential backoff retry. |

---

## 2. Identified Gaps & Defect Register Before Part 3B

1. **Event Types Missing in `@saar/contracts` and `@saar/domain`**:
   - `gap.detected`
   - `intervention.proposed`
   - `intervention.rejected`
   - `schedule.adaptation_proposed`
   - `schedule.adaptation_accepted`
   *Fix*: Add to `EventType` in `packages/contracts/src/events/index.ts` and `BEHAVIOR_EVENT_TYPES` in `packages/domain/src/taxonomy/behavior-taxonomy.ts`.

2. **Intervention Lifecycle & Outcome Measurement Gap**:
   - The database schema supports `Intervention` with `status`, `payload`, and `outcome`. However, there is no service or controller layer managing the transition lifecycle (`PROPOSED` -> `ACCEPTED` / `DISMISSED` -> `COMPLETED` / `FAILED`), nor any mechanism to calculate the `outcomeDelta` against the baseline measurement window.
   *Fix*: Implement pure outcome calculation domain logic in `@saar/domain` and full REST lifecycle APIs in `@saar/api`.

3. **Absence of Life Trade-off Engine**:
   - SAAR currently identifies gaps but cannot evaluate whether fixing a gap by adding a task or routine introduces severe resource conflicts (e.g. studying 60 minutes encroaches on sleep or family commitments).
   *Fix*: Build pure `packages/domain/src/tradeoff/` modeling finite capacity, costs, conflicts, and benefits.

4. **Absence of Adaptive Scheduling & Simulation**:
   - Current planning in `PlansService` only assigns tasks to dates without time-slot capacity modeling, historical completion probability by time-of-day, or conflict simulation (`Current Plan` vs `Proposed Plan`).
   *Fix*: Build pure `packages/domain/src/scheduling/` with capacity modeling, candidate scoring, and diff simulation.

5. **Daily Growth Needs Decomposition (Modular Orchestrator)**:
   - Existing `DailyGrowthService` in `apps/api` is a monolithic file providing basic check-in and placeholder session events.
   *Fix*: Refactor into an orchestrator pattern (`DailyGrowthOrchestrator`) composed of decoupled domain analyzers (`DailyStateBuilder`, `ExecutionAnalyzer`, `GapAnalyzer`, `TradeoffAnalyzer`, `InterventionSelector`, `TomorrowPlanner`).

---

## 3. Readiness Verdict

The foundation from Parts 1, 2, and 3A is architecturally sound and passed 100% of monorepo tests. We are ready to proceed with implementing Part 3B once the missing event types and domain modules are introduced.
