# SAAR Event Taxonomy & Schema Versioning Specification (Part 2A)

## 1. Event Envelope Architecture
All internal domain facts published to the transactional outbox (`OutboxEvent`), message queues, and telemetry streams conform to the universal `EventEnvelope<T>`:

```typescript
export interface EventEnvelope<T = unknown> {
  id: string;               // UUID v4 unique event identifier
  type: EventType;          // Canonical dot-notated event name
  schemaVersion: number;    // Monotonically increasing schema version (default 1)
  occurredAt: string;       // ISO-8601 UTC timestamp
  producer: string;         // Emitting service/module (e.g. "api-gateway")
  actor: {
    type: 'USER' | 'SYSTEM' | 'ADMIN' | 'SUPPORT';
    id: string;             // User UUID or system identifier
  };
  aggregate: {
    type: string;           // Entity name (e.g. "Task", "Routine", "Goal")
    id: string;             // Aggregate root UUID
  };
  payload: T;               // Strongly typed, validated domain payload
  traceId?: string;         // W3C distributed trace context
}
```

---

## 2. Canonical Event Taxonomy Catalogue

| Category | Event Name (`EventType`) | Version | Aggregate | Description |
|----------|--------------------------|---------|-----------|-------------|
| **User** | `user.registered` | 1 | `User` | User completed registration & profile creation |
| **Goal** | `goal.created` | 1 | `Goal` | New personal goal initialized |
| **Goal** | `goal.updated` | 1 | `Goal` | Goal title, target date, or priority modified |
| **Goal** | `goal.completed` | 1 | `Goal` | Goal marked completed |
| **Goal** | `goal.progress_updated` | 1 | `Goal` | New metric observation recorded |
| **Task** | `task.created` | 1 | `Task` | New task scheduled or added to inbox |
| **Task** | `task.started` | 1 | `Task` | Task transitioned to `IN_PROGRESS` |
| **Task** | `task.completed` | 1 | `Task` | Task transitioned to `COMPLETED` |
| **Task** | `task.skipped` | 1 | `Task` | Task bypassed with reason |
| **Task** | `task.snoozed` | 1 | `Task` | Task postponed temporarily |
| **Task** | `task.rescheduled` | 1 | `Task` | Task scheduled date/time explicitly altered |
| **Routine** | `routine.started` | 1 | `Routine` | Habit execution began for today's occurrence |
| **Routine** | `routine.completed` | 1 | `Routine` | Routine completed for today's occurrence |
| **Routine** | `routine.skipped` | 1 | `Routine` | Routine skipped for today's occurrence |
| **Alarm** | `alarm.triggered` | 1 | `Notification` | Wakeup/Habit alarm activated on client |
| **Alarm** | `alarm.dismissed` | 1 | `Notification` | Client dismissed alarm |
| **Checkin** | `checkin.completed` | 1 | `Checkin` | Daily subjective mood/energy submitted |
| **Growth** | `daily_growth.started` | 1 | `User` | User opened daily growth experience |
| **Growth** | `daily_growth.completed` | 1 | `User` | User completed daily growth sequence |
| **Insight** | `insight.viewed` | 1 | `Insight` | Synthesized pattern displayed to user |
| **Insight** | `insight.accepted` | 1 | `Insight` | User acknowledged insight recommendation |
| **Intervention** | `intervention.accepted` | 1 | `Intervention` | User accepted proposed intervention |
| **Intervention** | `intervention.completed`| 1 | `Intervention` | Intervention action successfully executed |
| **Companion** | `companion.message.sent`| 1 | `Conversation` | Dialogue interaction recorded |
| **Memory** | `memory.created` | 1 | `Memory` | Fact-based long-term context extracted |
| **Memory** | `memory.revoked` | 1 | `Memory` | User revoked consent for stored memory |
| **Notification** | `notification.delivered`| 1 | `Notification` | Push notification received on device |
| **Billing** | `subscription.changed` | 1 | `User` | Subscription tier mutated |

---

## 3. Runtime Schema Validation (Zod)
Unlike compile-time TypeScript types that disappear after build, event payloads are strictly validated before persisting to `outbox_events` or `behavior_events`.

Available in `@saar/contracts`:
```typescript
import { validateDomainEvent, TaskEventPayloadSchema } from '@saar/contracts';

const result = validateDomainEvent(eventData, TaskEventPayloadSchema);
if (!result.success) {
  // Reject invalid payload with ZodError details
  throw new Error(`Schema validation failed: ${result.error.message}`);
}
```

---

## 4. Schema Evolution & Versioning Rules
1. **Additive Changes (Non-breaking)**:
   - Adding optional fields retains current `schemaVersion`.
   - Consumers must handle undefined gracefully (`defaultValue` or optional chaining).
2. **Breaking Changes**:
   - Renaming fields, changing data types, or making previously optional fields required requires incrementing `schemaVersion` (e.g. from `1` to `2`).
   - Consumers must implement dual-version handlers (`if (event.schemaVersion === 1) ... else if (event.schemaVersion === 2) ...`).
