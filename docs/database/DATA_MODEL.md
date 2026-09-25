# SAAR Data Model & Domain Architecture Specification (Part 2A)

## 1. Overview & Architecture Principles
SAAR (Personal Growth Intelligence Platform) models human personal development through a hierarchical yet feedback-driven domain ontology:

```
[Identity & Vision]
   User ──1:1── FutureSelf
    │
    ├──1:N── LifeArea (Mind, Health, Career, Relationships, etc.)
    │          │
    │          ├──1:N── Goal
    │                     │
    │                     ├──1:N── GoalMetric
    │                     │          │
    │                     │          └──1:N── MetricObservation (Historical Measurements)
    │                     │
    │                     └──1:N── Task (Behavioral Execution)
    │
    ├──1:N── Routine (Templates)
    │          │
    │          └──1:N── RoutineOccurrence (Daily Execution Records)
    │
    ├──1:N── Plan (Daily Calendar / Versioned Active Plans)
    ├──1:N── Checkin (Subjective Daily Reflections)
    ├──1:N── BehaviorEvent (Immutable Event Log)
    ├──1:N── Insight ──1:N── Intervention (Growth Feedback Loop)
    └──1:N── Conversation ──1:N── Message + Memory (AI Intelligence)
```

---

## 2. Core Entities & Schema Reference

### 2.1 Identity & Session Layer
- **`users` (`User`)**:
  - `id` (UUID PK): System-wide tenant key.
  - `email` (VARCHAR Unique): Normalised account identifier.
  - `passwordHash` (TEXT): Argon2id cryptographic hash.
  - `status` (`ACTIVE | SUSPENDED | DELETED`).
  - `timezone` (VARCHAR): IANA timezone identifier (e.g. `"Asia/Kolkata"`, `"America/New_York"`).
  - `locale` (VARCHAR): Standard locale identifier (e.g. `"en-IN"`).
  - **Index**: `status`.
- **`user_profiles` (`UserProfile`)**:
  - `userId` (UUID Unique FK): 1:1 with `User` (`ON DELETE CASCADE`).
  - `displayName`, `avatarUrl`, `preferences` (JSONB).
- **`sessions` (`Session`)**:
  - `refreshHash` (TEXT): Argon2id hash of compound refresh token secret.
  - `tokenFamilyId` (UUID): Family ID for rotation lineage tracking.
  - `rotatedAt` (TIMESTAMPTZ): Timestamp when token was replaced.
  - `expiresAt` (TIMESTAMPTZ): Hard expiry boundary (30 days).
  - **Indexes**: `[userId, expiresAt]`, `[tokenFamilyId]`.

### 2.2 Vision & Life Area Layer
- **`future_selves` (`FutureSelf`)**:
  - `userId` (UUID Unique FK): 1:1 with `User` (`ON DELETE CASCADE`).
  - `futureIdentity` (TEXT): Core identity affirmation statement.
  - `horizonYears` (INT): Default 5 years.
  - `desiredStates, priorities, values, lifeAreaTargets` (JSONB arrays).
- **`life_areas` (`LifeArea`)**:
  - `type` (VARCHAR): e.g. `health, career, mind, finance, relationships, personal, recovery_rest`.
  - `title` (VARCHAR): User-facing area label.
  - `weight` (DECIMAL(5,2)): Proportional life priority (0.00 - 100.00).
  - `color` (VARCHAR): Hex UI accent color (e.g. `"#6366f1"`).
  - `isActive` (BOOLEAN): Soft active state (default `true`).
  - `sortOrder` (INT): Display ordering.
  - **Indexes**: `[userId, type]`, `[userId, isActive, sortOrder]`.

### 2.3 Goals, Metrics & Historical Observations Layer
- **`goals` (`Goal`)**:
  - `userId` (UUID FK), `lifeAreaId` (UUID FK `ON DELETE SET NULL`).
  - `title`, `description`, `reason` (Gap Engine driver).
  - `status` (`ACTIVE | COMPLETED | PAUSED | ARCHIVED`).
  - `priority` (INT 1-5), `targetDate` (TIMESTAMPTZ).
  - **Indexes**: `[userId, status]`, `[lifeAreaId, status]`.
- **`goal_metrics` (`GoalMetric`)**:
  - `goalId` (UUID FK `ON DELETE CASCADE`).
  - `metricType` (`distance | count | boolean | percentage | duration`).
  - `targetValue` (DECIMAL(14,4)), `currentValue` (DECIMAL(14,4)), `unit` (VARCHAR).
  - **Index**: `goalId`.
- **`metric_observations` (`MetricObservation`)** *(NEW IN PART 2A)*:
  - `metricId` (UUID FK `ON DELETE CASCADE`).
  - `value` (DECIMAL(14,4)): Exact measurement at `observedAt`.
  - `observedAt` (TIMESTAMPTZ): Instant of measurement.
  - `source` (`user | device | integration | calculation`).
  - `unit` (VARCHAR), `confidence` (DECIMAL(5,4)), `metadata` (JSONB).
  - **Index**: `[metricId, observedAt]` enabling high-speed timeline and velocity queries.

### 2.4 Tasks & Behavioral Execution Layer
- **`tasks` (`Task`)**:
  - `userId` (UUID FK), `goalId` (UUID FK `ON DELETE SET NULL`), `lifeAreaId` (UUID FK `ON DELETE SET NULL`), `planId` (UUID FK `ON DELETE SET NULL`).
  - `status` (`TODO | IN_PROGRESS | COMPLETED | SKIPPED | CANCELLED | RESCHEDULED`).
  - `priority` (INT 1-5).
  - Behavioral tracking fields *(NEW IN PART 2A)*:
    - `scheduledAt` (TIMESTAMPTZ): Planned execution time.
    - `originalDueAt` (TIMESTAMPTZ): Immutably preserved initial deadline.
    - `dueAt` (TIMESTAMPTZ): Current effective deadline.
    - `startedAt` (TIMESTAMPTZ): Instant task was started.
    - `completedAt` (TIMESTAMPTZ): Instant task was finished.
    - `skippedAt` (TIMESTAMPTZ): Instant task was bypassed.
    - `rescheduledAt` (TIMESTAMPTZ): Instant task was rescheduled.
    - `rescheduleCount` (INT default 0): Times rescheduled.
    - `estimatedMinutes` (INT), `actualDurationMinutes` (INT).
    - `skipReason` (TEXT), `rescheduleReason` (TEXT).
  - **Indexes**: `[userId, dueAt, status]`, `[userId, scheduledAt, status]`, `[goalId, status]`, `[lifeAreaId, status]`.

### 2.5 Routines & Occurrences Layer
- **`routines` (`Routine`)**:
  - Template defining "What should repeat": `recurrenceRule` (RFC 5545 RRULE), `timezone`, `preferredTime`, `active`.
  - **Index**: `[userId, active]`.
- **`routine_occurrences` (`RoutineOccurrence`)** *(NEW IN PART 2A)*:
  - Day-to-day execution records:
    - `routineId` (UUID FK `ON DELETE CASCADE`), `userId` (UUID FK `ON DELETE CASCADE`).
    - `localDate` (DATE): User calendar date.
    - `expectedAt` (TIMESTAMPTZ): Expected execution instant.
    - `status` (`PENDING | COMPLETED | SKIPPED | MISSED`).
    - `startedAt, completedAt, skippedAt` (TIMESTAMPTZ).
    - `actualDuration` (INT), `reason` (TEXT), `metadata` (JSONB).
  - **Unique Constraint**: `@@unique([routineId, localDate])` preventing duplicate records for the same day.
  - **Index**: `[userId, localDate, status]`.

### 2.6 Daily Planning & Check-ins Layer
- **`plans` (`Plan`)**:
  - `userId` (UUID FK), `localDate` (DATE), `generatedBy`, `version` (INT), `status` (`ACTIVE | SUPERSEDED | ARCHIVED`).
  - **Unique Constraint**: `@@unique([userId, localDate, version])`.
  - **Index**: `[userId, localDate, status]`.
- **`checkins` (`Checkin`)**:
  - `userId` (UUID FK), `localDate` (DATE), `mood` (1-5), `energy` (1-5), `dayRating` (1-5), `reflection` (TEXT).
  - **Unique Constraint**: `@@unique([userId, localDate])`.
  - **Index**: `[userId, localDate]`.

### 2.7 Telemetry, Events & Growth Intelligence Layer
- **`behavior_events` (`BehaviorEvent`)**: Immutable event audit stream.
  - **Indexes**: `[userId, occurredAt]`, `[userId, eventType, occurredAt]`.
- **`insights` & `interventions`**:
  - `Insight`: Pattern synthesis with `generationVersion` and `sourceDataRef`.
  - `Intervention`: Actionable coaching with `executedAt` and `decisionReason`.
- **`conversations`, `messages`, `memories`**:
  - `Message`: Added `tokenUsage, latencyMs`.
  - `Memory`: Fact-based storage with `confidence, sensitivity, lastValidatedAt, userVisible, userEditable`.
- **`outbox_events` (`OutboxEvent`)**:
  - Transactional outbox with `schemaVersion`, `attempts`, `availableAt`, `processedAt`.
  - **Index**: `[status, availableAt]`.
