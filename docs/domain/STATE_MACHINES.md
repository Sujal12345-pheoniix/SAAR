# SAAR Domain State Machines (Part 2B)

This document formalizes the life-cycle states, permissible transitions, validation guards, and behavioral side-effects for SAAR's core aggregates.

---

## 1. Goal State Machine

### Statuses
- `ACTIVE`: The goal is currently being pursued.
- `PAUSED`: Temporarily on hold.
- `COMPLETED`: Successfully achieved.
- `ARCHIVED`: Soft-deleted / retired from active tracking.

### Transition Matrix
```
   [ACTIVE] ───(pause)───> [PAUSED]
      │                       │
  (complete)              (resume)
      │                       │
      ▼                       ▼
 [COMPLETED] <──────────── [ACTIVE]
      │                       │
  (reopen)                (archive)
      │                       │
      ▼                       ▼
   [ACTIVE] <──────────── [ARCHIVED]
```

| From | To | Method / Endpoint | Guard / Side Effect |
|---|---|---|---|
| `ACTIVE` | `COMPLETED` | `POST /goals/:id/complete` | Idempotent; emits `goal.completed` |
| `ACTIVE` | `PAUSED` | `POST /goals/:id/pause` | Idempotent; emits `goal.updated` (action: pause) |
| `ACTIVE` | `ARCHIVED` | `POST /goals/:id/archive` | Emits `goal.updated` (action: archive) |
| `PAUSED` | `ACTIVE` | `PATCH /goals/:id` (status: ACTIVE) | Emits `goal.updated` |
| `PAUSED` | `ARCHIVED` | `POST /goals/:id/archive` | Emits `goal.updated` |
| `COMPLETED` | `ACTIVE` | `POST /goals/:id/reopen` | Reopens completed goal; emits `goal.updated` |
| `ARCHIVED` | `ACTIVE` | `PATCH /goals/:id` (status: ACTIVE) | Restores goal |

---

## 2. Task State Machine

### Statuses
- `TODO`: Scheduled / open task.
- `IN_PROGRESS`: Currently being executed.
- `COMPLETED`: Finished.
- `SKIPPED`: Intentionally bypassed for this instance.
- `CANCELLED`: Abandoned / no longer applicable.
- `RESCHEDULED`: Due date moved forward in time.

### Transition Matrix
```
               ┌──────── (start) ────────> [IN_PROGRESS]
               │                                │
               │                                │ (complete)
               │                                ▼
[TODO] ────────┼────── (complete) ───────> [COMPLETED] (terminal)
               │
               ├─────── (skip) ──────────> [SKIPPED]
               │                                │ (re-schedule/reset)
               │                                ▼
               ├────── (cancel) ─────────> [CANCELLED]
               │                                │ (re-activate)
               │                                ▼
               └───── (reschedule) ──────> [RESCHEDULED] ───> [TODO]
```

### Invariants & Guard Rules
1. **Completion Idempotency**: Completing an already `COMPLETED` task returns the existing record without raising an error.
2. **CompletedAt Timestamp**: Setting `COMPLETED` always stamps `completedAt = now()`.
3. **StartedAt Timestamp**: Transitioning to `IN_PROGRESS` sets `startedAt = now()`.
4. **Skip/Cancel Reasons**: Optional explanatory string persisted to `skipReason` and `rescheduleReason`.
5. **Reschedule Count**: Calling `/tasks/:id/reschedule` increments `rescheduleCount` atomically.

---

## 3. Routine Occurrence State Machine

### Statuses
- `PENDING`: Scheduled for the local day.
- `COMPLETED`: Done for the day.
- `SKIPPED`: Skipped with explanation.
- `MISSED`: End-of-day rollover detected no completion.

### Idempotency
- Uniqueness enforced at the DB level by composite key: `[routineId, localDate]`.
- Fetching or generating for a given day is idempotent via `upsert`.
