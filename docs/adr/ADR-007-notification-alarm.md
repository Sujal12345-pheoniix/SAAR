# ADR-007: Notification & Alarm Platform Strategy

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead, Mobile Lead             |

---

## Context

SAAR needs to deliver timely, useful notifications for:

- Routine reminders (e.g., "Time for your morning routine — 06:00 daily")
- Task due date alerts ("Run scheduled for today — don't skip it")
- Goal progress nudges ("You're 3 days without a check-in")
- AI-generated coaching nudges ("Your energy is usually highest before 9 AM")
- Checkin prompts ("How's your day going?")
- Subscription and system events

### Platform Constraints

| Platform  | Constraint                                                                 |
|-----------|----------------------------------------------------------------------------|
| iOS       | Background app refresh not guaranteed; local notifications must be scheduled in advance |
| Android   | Doze mode restricts background wakeup; FCM is the reliable push path       |
| Web       | Web Push API requires explicit permission; service worker needed            |

**The key constraint**: on iOS, an app cannot receive a push notification and then
schedule a precise local alarm (e.g., 06:00 tomorrow) in the background reliably.
The OS kills background processes. Local alarm scheduling must happen while the app
is in the foreground.

This creates a server-client coordination problem: **the server knows the rules, the
client knows the platform alarm API**.

### Options Considered

| Approach                               | Pros                               | Cons                                               |
|----------------------------------------|------------------------------------|----------------------------------------------------|
| **Server schedules push, client rings**| Simple server logic                | Push delivery not guaranteed, silent push unreliable on iOS |
| **Client schedules local alarms**      | Reliable, works offline            | Server has no visibility, sync needed              |
| **Server authoritative + client executes** | Best of both | Requires coordination protocol              |
| **Third-party (OneSignal, Novu)**      | Pre-built, managed                 | Vendor lock-in, cost at scale, data privacy concern |

---

## Decision

**The server is authoritative for all notification rules, schedules, and recurrence.
The client is responsible for registering platform-specific alarms. A sync protocol
keeps them consistent.**

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Server (Authoritative)                                           │
│                                                                   │
│  notifications table:                                             │
│    id, user_id, type, title, body, scheduled_at,                 │
│    recurrence_rule (RRULE), channel, status, created_at          │
│                                                                   │
│  Responsibilities:                                                │
│  - Create/update/delete notification rules                        │
│  - Evaluate recurrence (next occurrence)                         │
│  - Push via FCM/APNs when app is closed (best-effort)            │
│  - Track delivery status                                          │
│  - Provide sync endpoint: GET /notifications/schedule            │
└─────────────────────────────────────────────────────────────────┘

        ↕  Sync on foreground / app open / explicit refresh

┌─────────────────────────────────────────────────────────────────┐
│  Client (Executor)                                                │
│                                                                   │
│  Responsibilities:                                                │
│  - On app open: fetch notification schedule from server           │
│  - Register local alarms for next 7 days of occurrences          │
│  - Cancel stale alarms (user deleted a notification rule)        │
│  - On alarm fire: mark as delivered via POST /notifications/ack  │
│  - Request push permission (iOS/Android/Web)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Notification Types & Channels

| type                    | Channel           | Delivery             |
|-------------------------|-------------------|----------------------|
| `routine_reminder`      | Local alarm       | Client schedules     |
| `task_due`              | Local alarm       | Client schedules     |
| `checkin_prompt`        | Local alarm       | Client schedules     |
| `ai_nudge`              | Push (FCM/APNs)   | Server sends         |
| `goal_milestone`        | Push (FCM/APNs)   | Server sends         |
| `subscription_event`    | Push + email      | Server sends both    |
| `system_alert`          | In-app banner     | WebSocket            |

### Recurrence Format

Notification schedules use **iCalendar RRULE** (RFC 5545):

```
FREQ=DAILY;BYHOUR=6;BYMINUTE=0;BYSECOND=0
FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=7;BYMINUTE=30
FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=9;BYMINUTE=0
```

Server computes the next N occurrences; client uses them as local alarm targets.

### Sync Protocol

```
1. App enters foreground
2. Client calls GET /v1/notifications/schedule?since={lastSyncAt}
3. Server returns:
   {
     notifications: [...],  // all active rules with next 14 occurrences
     deletedIds: [...],      // IDs removed since lastSyncAt
     syncedAt: "ISO-8601"
   }
4. Client reconciles local alarms:
   - Cancel alarms for deletedIds
   - Update alarms for changed schedules
   - Register alarms for new notifications
5. Client stores syncedAt locally
```

### Push Provider

Phase 1 push is delivered via **Firebase Cloud Messaging (FCM)** for Android and Web,
and **APNs** (via FCM or direct HTTP/2) for iOS. Push is best-effort — local alarms
are the reliable path for time-sensitive notifications.

---

## Consequences

### Positive
- Reliable alarm delivery on iOS (local alarms fire even in background).
- Server has full visibility and control over notification rules.
- Recurrence logic lives on the server — changes propagate on next sync.
- Works offline (local alarms pre-registered for 7 days).

### Negative / Risks
- Sync delay: if user never opens the app, schedule changes won't apply.
  **Mitigation**: push a silent "sync required" push on rule change.
- Platform alarm APIs differ (iOS `UNUserNotificationCenter` vs Android `AlarmManager`).
  **Mitigation**: mobile client abstracts this behind a `NotificationScheduler` interface.
- Battery impact: local alarm registration is a one-time cost at sync time.
  **Mitigation**: batched registration, not per-notification.

---

## References

- [RFC 5545 — iCalendar](https://www.rfc-editor.org/rfc/rfc5545)
- [Apple UNUserNotificationCenter](https://developer.apple.com/documentation/usernotifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Android AlarmManager](https://developer.android.com/reference/android/app/AlarmManager)
