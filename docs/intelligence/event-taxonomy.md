# SAAR Behavior Event Taxonomy (v1.0)

Every behavioral action in SAAR emits an immutable event conforming to the canonical taxonomy.

---

## 1. Schema Envelope

```typescript
export interface BehaviorEventRecord {
  id: string;             // UUID v4
  userId: string;         // UUID v4
  eventType: string;      // Canonical dot-notation
  schemaVersion: number;  // Monotonic version integer (default: 1)
  occurredAt: Date;       // Wall-clock timestamp (UTC)
  source: string;         // 'web' | 'mobile' | 'api' | 'worker' | 'system'
  entityType?: string;    // 'Task' | 'Goal' | 'Routine' | 'Checkin' | 'Plan'
  entityId?: string;      // UUID of target aggregate
  metadata?: Record<string, unknown>; // Validated payload
}
```

---

## 2. Event Catalogue

| Event Type | Producer | Consumer | Entity Type | Retention | PII Class | Description |
|---|---|---|---|---|---|---|
| `task.created` | TasksService | Growth Engine | Task | 3 Years | Low | Task defined |
| `task.started` | TasksService | Growth Engine | Task | 3 Years | Low | Execution initiated |
| `task.completed` | TasksService | Growth Engine | Task | 3 Years | Low | Task finished |
| `task.skipped` | TasksService | Growth Engine | Task | 3 Years | Low | Task bypassed (optional reason) |
| `task.cancelled` | TasksService | Growth Engine | Task | 3 Years | Low | Task cancelled |
| `task.rescheduled` | TasksService | Growth Engine | Task | 3 Years | Low | Due date changed |
| `routine.created` | RoutinesService | Growth Engine | Routine | 3 Years | Low | Recurring routine defined |
| `routine.completed`| RoutinesService | Growth Engine | RoutineOccurrence | 3 Years | Low | Occurrence completed |
| `routine.skipped` | RoutinesService | Growth Engine | RoutineOccurrence | 3 Years | Low | Occurrence skipped |
| `routine.archived` | RoutinesService | Growth Engine | Routine | 3 Years | Low | Routine retired |
| `goal.created` | GoalsService | Growth Engine | Goal | 5 Years | Low | Goal established |
| `goal.updated` | GoalsService | Growth Engine | Goal | 5 Years | Low | Attributes or status updated |
| `goal.completed` | GoalsService | Growth Engine | Goal | 5 Years | Low | Goal achieved |
| `checkin.completed`| DailyGrowthService| Growth Engine | Checkin | 5 Years | Moderate | Daily mood/energy/reflection |
| `daily_growth.started`| DailyGrowthService| Growth Engine | GrowthSession| 1 Year | Low | Daily session opened |
| `daily_growth.completed`| DailyGrowthService| Growth Engine | GrowthSession| 1 Year | Low | Daily session concluded |
| `plan.created` | PlansService | Growth Engine | Plan | 1 Year | Low | Daily plan generated |

---

## 3. Validation Rules

- Unrecognized event types are rejected before persistence or ingestion.
- `occurredAt` cannot be in the future (skew tolerance: 60 seconds).
- `userId` must refer to an active user.
