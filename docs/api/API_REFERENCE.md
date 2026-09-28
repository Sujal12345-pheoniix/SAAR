# SAAR API Reference Specification (v1.0 - Part 2B Core Workflows)

All endpoints require standard Bearer token authentication via `Authorization: Bearer <accessToken>` header unless marked `[Public]`.
Base path: `/api/v1`

---

## 1. Authentication & Sessions (`/auth`)

| Method | Path | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user + initial profile + session | 5 / min |
| `POST` | `/auth/login` | Email/password login with argon2 verification | 10 / min |
| `POST` | `/auth/refresh` | Rotate refresh token family | 20 / min |
| `POST` | `/auth/logout` | Revoke current session | Authenticated |
| `POST` | `/auth/logout-all` | Revoke all active sessions for current user | Authenticated |
| `GET` | `/auth/sessions` | List active sessions with device/user-agent info | Authenticated |
| `DELETE` | `/auth/sessions/:id` | Revoke specific session (ownership enforced) | Authenticated |

---

## 2. User & Profile (`/me`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Get current authenticated user + profile (excluding passwordHash) |
| `PATCH` | `/me` | Update `displayName`, `timezone`, `locale` |
| `GET` | `/me/preferences` | Retrieve structured user preferences JSON |
| `PATCH` | `/me/preferences` | Deep merge user preferences |

---

## 3. Future Self (`/future-self`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/future-self` | Retrieve user's configured Future Self vision & horizons |
| `PUT` | `/future-self` | Create or replace structured Future Self (identity, desired states, priorities, values) |

---

## 4. Life Areas (`/life-areas`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/life-areas` | List all life areas (auto-seeds 6 default areas on first access) |
| `POST` | `/life-areas` | Create custom life area (`title`, `type`, `weight`, `color`, `sortOrder`) |
| `GET` | `/life-areas/:id` | Get specific life area (tenant isolated) |
| `PATCH` | `/life-areas/:id` | Update life area attributes |
| `POST` | `/life-areas/:id/archive`| Soft-delete life area (`isActive: false`) |
| `DELETE` | `/life-areas/:id` | Hard delete life area |

---

## 5. Goals & Metrics (`/goals`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/goals` | List goals with optional filters (`status`, `lifeAreaId`, `cursor`, `limit`) |
| `POST` | `/goals` | Create goal linked to Life Area + optional initial metrics |
| `GET` | `/goals/:id` | Get goal details, life area, and metrics with latest observation |
| `PATCH` | `/goals/:id` | Update goal title, reason, priority, targetDate, lifeAreaId |
| `POST` | `/goals/:id/complete` | Transition goal to `COMPLETED` (idempotent, emits `goal.completed`) |
| `POST` | `/goals/:id/reopen` | Reopen completed goal back to `ACTIVE` (emits `goal.updated`) |
| `POST` | `/goals/:id/pause` | Pause active goal (emits `goal.updated`) |
| `POST` | `/goals/:id/archive` | Archive goal (emits `goal.updated` with action: archive) |

### Goal Metrics & Observations
| Method | Path | Description |
|---|---|---|
| `POST` | `/goals/:goalId/metrics` | Create new metric definition for goal |
| `PATCH` | `/goals/:goalId/metrics/:metricId` | Update metric definition |
| `DELETE` | `/goals/:goalId/metrics/:metricId` | Delete metric definition |
| `POST` | `/goals/:goalId/metrics/:metricId/observations` | Record metric observation (`value`, `source`, `unit`, `observedAt`) |
| `GET` | `/goals/:goalId/metrics/:metricId/observations` | Paginated observation history (cursor-based) |
| `GET` | `/goals/:goalId/metrics/:metricId/observations/latest` | Get most recent observation |

---

## 6. Routines & Occurrences (`/routines`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/routines` | List all user routines |
| `POST` | `/routines` | Create routine (`title`, `recurrenceRule`, `preferredTime`, `timezone`) |
| `GET` | `/routines/:id` | Get routine details |
| `PATCH` | `/routines/:id` | Update routine |
| `POST` | `/routines/:id/pause` | Pause routine (`active: false`) |
| `POST` | `/routines/:id/resume` | Resume routine (`active: true`) |
| `POST` | `/routines/:id/archive` | Archive routine (emits `routine.archived`) |
| `DELETE` | `/routines/:id` | Delete routine |
| `POST` | `/routines/:id/complete` | Complete routine shell for today |
| `POST` | `/routines/:id/skip` | Skip routine shell for today |

### Routine Occurrences
| Method | Path | Description |
|---|---|---|
| `GET` | `/routines/:routineId/occurrences` | List occurrences (`date`, `status`, `limit`) |
| `POST` | `/routines/:routineId/occurrences` | Idempotently create or retrieve occurrence for `localDate` |
| `POST` | `/routines/:routineId/occurrences/:occId/complete` | Complete occurrence with `actualDuration` (emits `routine.completed`) |
| `POST` | `/routines/:routineId/occurrences/:occId/skip` | Skip occurrence with `reason` (emits `routine.skipped`) |
| `POST` | `/routines/:routineId/occurrences/:occId/miss` | Mark occurrence as missed |

---

## 7. Tasks (`/tasks`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | List tasks with filters (`status`, `goalId`, `lifeAreaId`, `planId`, `cursor`, `limit`) |
| `POST` | `/tasks` | Create task with tenant relationship validation (goal, lifeArea, plan) |
| `GET` | `/tasks/:id` | Get task details |
| `PATCH` | `/tasks/:id` | Update task with state machine enforcement |
| `POST` | `/tasks/:id/start` | Transition to `IN_PROGRESS` (sets `startedAt`) |
| `POST` | `/tasks/:id/complete` | Transition to `COMPLETED` (sets `completedAt`, idempotent) |
| `POST` | `/tasks/:id/skip` | Transition to `SKIPPED` with optional `reason` |
| `POST` | `/tasks/:id/cancel` | Transition to `CANCELLED` with optional `reason` |
| `POST` | `/tasks/:id/reschedule` | Reschedule due date with reason, increments `rescheduleCount` |

---

## 8. Daily Plans (`/plans`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/plans/today` | Timezone-aware retrieval/generation of today's plan |
| `GET` | `/plans` | Paginated list of historical plans |
| `POST` | `/plans` | Create explicit plan version (automatically supersedes prior active version) |
| `GET` | `/plans/:id` | Get plan details with ordered tasks |
| `PATCH` | `/plans/:id` | Update plan attributes |
| `POST` | `/plans/:id/tasks` | Add task to plan with priority order |
| `DELETE` | `/plans/:id/tasks/:taskId` | Remove task from plan |
| `POST` | `/plans/:id/tasks/reorder` | Bulk reorder task priorities within plan |

---

## 9. Daily Growth & Check-in (`/daily-growth`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/daily-growth/today` | Deterministic daily dashboard (active goals, today tasks, routines, checkin status, alignment score) |
| `POST` | `/daily-growth/checkin` | Upsert daily check-in (`mood`, `energy`, `dayRating`, `reflection`) |
| `GET` | `/daily-growth/checkins` | Paginated check-in history with `from` and `to` date range filters |
| `GET` | `/daily-growth/checkins/:date` | Get check-in for a specific calendar date |
| `GET` | `/daily-growth/session` | Get active/completed state for today's growth session |
| `POST` | `/daily-growth/session/start` | Start daily growth session (emits `daily_growth.started`) |
| `POST` | `/daily-growth/session/complete` | Complete daily growth session (emits `daily_growth.completed`) |

---

## 10. Behavior Events (`/behavior-events`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/behavior-events` | Cursor-paginated behavioral telemetry stream with `eventType`, `from`, and `to` filters |
