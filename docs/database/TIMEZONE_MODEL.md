# SAAR Timezone Architecture & Local Date Model (Part 2A)

## 1. Principles & Fundamentals

Personal growth tracking is fundamentally time-sensitive. A habit, check-in, or daily task belongs to a human being's calendar day, not UTC midnight.

SAAR enforces a strict separation:

| Concept | PostgreSQL Type | Representation | Examples |
|---------|-----------------|----------------|----------|
| **UTC Instant** | `TIMESTAMP(3) WITH TIME ZONE` (`DateTime`) | Exact moment in physical time across the universe | `occurredAt`, `createdAt`, `dueAt`, `expiresAt`, `startedAt` |
| **Local Calendar Date** | `DATE` (`@db.Date`) | Calendar day according to the user's current timezone | `localDate` in `Checkin`, `Plan`, `RoutineOccurrence` |
| **Timezone Identifier** | `VARCHAR` | Canonical IANA string identifier | `Asia/Kolkata`, `America/New_York`, `UTC` |
| **Local Time of Day** | `VARCHAR(5)` | Wall-clock hours & minutes | `preferredTime = "07:00"` (7:00 AM user time) |

---

## 2. Resolving User Local Date

When an event occurs or a daily record is created:
1. Fetch the user's active IANA `timezone` from `User.timezone` (default `"Asia/Kolkata"`).
2. Format the UTC instant into the user's localized `YYYY-MM-DD` string:
   ```typescript
   export function getLocalDate(utcDate: Date, timezone: string): string {
     const formatter = new Intl.DateTimeFormat('en-CA', {
       timeZone: timezone,
       year: 'numeric',
       month: '2-digit',
       day: '2-digit',
     });
     return formatter.format(utcDate); // Returns "YYYY-MM-DD"
   }
   ```
3. Store the resulting `DATE` in PostgreSQL (`localDate`).

---

## 3. Boundary Edge Cases & Failure Scenarios

### 3.1 Midnight Boundary
- **Problem**: In India (IST, UTC+5:30), a task completed at 01:30 AM on 2026-09-25 is physically `2026-09-24 20:00:00 UTC`.
- **Handling**: Using `localDate` ensures the task completion and daily check-in are bound to `2026-09-25`, matching the user's lived experience.

### 3.2 Daylight Saving Time (DST) Transitions
- **Problem**: When clocks spring forward or fall back in `America/New_York` or `Europe/London`, 24 hours of UTC do not equal 24 hours of local time (days can be 23 or 25 hours).
- **Handling**: Fixed offsets (e.g. `+05:30`, `-05:00`) are **never** stored permanently. Only full IANA identifiers (`America/New_York`) are stored so `Intl.DateTimeFormat` and recurrence engines dynamically compute historical and future DST shifts.

### 3.3 User Travel & Timezone Relocation
- When a user travels from Mumbai to London, they update `User.timezone = "Europe/London"`.
- **Integrity Guarantee**: Past check-ins, routine occurrences, and plans remain locked to their historical `localDate`. Future daily plans and alarms calculate occurrences relative to the new timezone.

### 3.4 Uniqueness Guarantees
- `checkins`: `@@unique([userId, localDate])` ensures exactly one check-in per user per calendar day.
- `routine_occurrences`: `@@unique([routineId, localDate])` ensures exactly one execution record per routine per calendar day.
- `plans`: `@@unique([userId, localDate, version])` prevents accidental plan duplication while supporting immutable plan revisions.
