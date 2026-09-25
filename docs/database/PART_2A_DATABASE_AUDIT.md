# SAAR Part 2A — Forensic Database & Domain Model Audit

## 1. Executive Summary
This audit examines SAAR's database architecture, Prisma schema (`prisma/schema.prisma`), migrations, seed scripts, and domain layer. The purpose is to identify structural gaps that prevent reliable personal growth tracking, historical behavioral analysis, and future intelligence extraction before implementing Part 2 application features.

---

## 2. Model-by-Model Forensic Audit

### 2.1 Identity & User Profile (`User`, `UserProfile`, `Session`, `Device`)
- **Strengths**:
  - `User` strictly encapsulates core identity (`email`, `passwordHash`, `status`, `timezone`, `locale`).
  - Separation of `User` and `UserProfile` prevents auth sessions from dragging presentation blobs.
  - `Session` implements compound token storage (`refreshHash`, `tokenFamilyId`, `rotatedAt`).
- **Gaps Identified**:
  - `User.timezone`: Defaulted to `"Asia/Kolkata"`. While valid for Indian launch, services must not assume server-local timezone or treat local calendar dates as UTC.
  - Cascade: `User -> Session`, `User -> UserProfile` cascades on delete (compliant with GDPR right to erasure).

### 2.2 Life Areas (`LifeArea`)
- **Current State**:
  - Contains `id, userId, type, title, targetState, weight`.
- **Gaps Identified**:
  - Missing `isActive Boolean` (users archiving or disabling life areas without losing past goals/tasks).
  - Missing `sortOrder Int` (UI ordering).
  - Missing `color String?` in DB schema (UI was having to mock or inject '#6366f1').

### 2.3 Future Self (`FutureSelf`)
- **Current State**:
  - 1:1 relationship with `User`. Stores `futureIdentity, horizonYears, desiredStates, priorities, values, lifeAreaTargets`.
- **Gaps Identified**:
  - JSON columns (`desiredStates, priorities, values, lifeAreaTargets`) store user vision arrays. Sits properly as the apex vision entity above Life Areas and Goals.

### 2.4 Goal & Goal Metrics (`Goal`, `GoalMetric`) — CRITICAL GAP
- **Current State**:
  - `Goal` tracks `title, description, reason, status, priority, targetDate`.
  - `GoalMetric` tracks `metricType, targetValue, currentValue, unit`.
- **Critical Flaw**:
  - Overwrite-in-place: Every time `currentValue` is modified, the previous measurement is permanently destroyed.
  - Zero trend analysis, velocity calculation, or trajectory intelligence can be derived without historical data points.
- **Remediation**:
  - Introduce `MetricObservation` model (`metricId, value, observedAt, source, unit, confidence, metadata`).

### 2.5 Tasks (`Task`) — BEHAVIORAL TRACKING GAP
- **Current State**:
  - `status TaskStatus` (`TODO, IN_PROGRESS, COMPLETED, SKIPPED, CANCELLED`).
  - Timestamps: `dueAt, completedAt, createdAt, updatedAt`.
- **Critical Flaw**:
  - Missing `RESCHEDULED` lifecycle state.
  - When a task is rescheduled or skipped, original due dates, skip reasons, and reschedule counts are overwritten or lost.
- **Remediation**:
  - Extend `TaskStatus` with `RESCHEDULED`.
  - Add behavioral tracking fields:
    - `scheduledAt DateTime?`
    - `originalDueAt DateTime?`
    - `startedAt DateTime?`
    - `skippedAt DateTime?`
    - `rescheduledAt DateTime?`
    - `rescheduleCount Int @default(0)`
    - `actualDurationMinutes Int?`
    - `skipReason String?`
    - `rescheduleReason String?`

### 2.6 Routines (`Routine`) — OCCURRENCE GAP
- **Current State**:
  - Defines `recurrenceRule (RRULE), timezone, preferredTime, active`.
- **Critical Flaw**:
  - Only stores the recurrence template. No record of day-to-day execution history exists.
- **Remediation**:
  - Introduce `RoutineOccurrence` model linked to `Routine` and `User` with `localDate @db.Date, expectedAt, status (PENDING, COMPLETED, SKIPPED, MISSED), startedAt, completedAt, skippedAt, actualDuration, reason`.

### 2.7 Plans (`Plan`)
- **Current State**:
  - `userId, localDate @db.Date, generatedBy, version`.
  - Unique constraint: `@@unique([userId, localDate, version])`.
- **Gaps Identified**:
  - Add `status String @default("ACTIVE")` to distinguish active plans from archived/superseded revisions.

### 2.8 Check-ins (`Checkin`)
- **Current State**:
  - `userId, localDate @db.Date, mood, energy, reflection, dayRating`.
  - Unique constraint: `@@unique([userId, localDate])`.
- **Assessment**:
  - Solid design. Local date ensures single check-in per user calendar day regardless of midnight UTC offset.

### 2.9 Behavior Events (`BehaviorEvent`)
- **Current State**:
  - `userId, eventType, occurredAt, source, entityType, entityId, metadata, schemaVersion`.
- **Gaps Identified**:
  - Event types must be formally taxonomized in `@saar/contracts`.
  - Event payload validation must be enforced at runtime via Zod schemas, not just TypeScript types.

### 2.10 Insights & Interventions (`Insight`, `Intervention`)
- **Gaps Identified**:
  - `Insight`: Add `generationVersion String?` and `sourceDataRef Json?` for auditability.
  - `Intervention`: Add `executedAt DateTime?` and `decisionReason String?`.

### 2.11 AI Memory & Telemetry (`Memory`, `Conversation`, `Message`)
- **Gaps Identified**:
  - `Memory`: Add `confidence, sensitivity, lastValidatedAt, userVisible, userEditable`.
  - `Message`: Add `tokenUsage Int?, latencyMs Int?` for performance budgeting.

### 2.12 Notifications, Audit, Outbox
- **Gaps Identified**:
  - `Notification`: Add `failedAt DateTime?, failureReason String?`.
  - `OutboxEvent`: Add `schemaVersion Int @default(1)`.

---

## 3. Risk Assessment & Migration Strategy
- All proposed additions are strictly additive:
  - New nullable columns or columns with deterministic defaults.
  - Zero column drops.
  - Zero data truncation.
  - Foreign keys configured with appropriate cascade rules (e.g. `Cascade` for sub-observations, `SetNull` for weak references).
- Existing production data in Neon PostgreSQL will migrate cleanly with 0 downtime.
