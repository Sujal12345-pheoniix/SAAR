# SAAR Data Retention & Deletion Policy (Part 2A)

## 1. Principles & Regulatory Compliance
SAAR stores deeply personal behavioral, cognitive, and habit data. The data lifecycle balances user privacy rights (GDPR Right to Erasure / DPDP India) with historical behavioral analytics and model integrity.

---

## 2. Foreign Key Cascade Matrix

| Parent Entity | Dependent Entity | Foreign Key Action | Rationale |
|---------------|------------------|--------------------|-----------|
| `User` | `UserProfile` | `ON DELETE CASCADE` | 1:1 user profile data must be erased when account is deleted. |
| `User` | `Session` | `ON DELETE CASCADE` | All auth sessions are instantly terminated. |
| `User` | `Device` | `ON DELETE CASCADE` | Device push tokens removed upon account deletion. |
| `User` | `FutureSelf` | `ON DELETE CASCADE` | Personal vision belongs strictly to user account. |
| `User` | `AuditLog` | `ON DELETE SET NULL`| Compliance logs are retained for auditing; `userId` anonymised to NULL. |
| `User` | `OutboxEvent` | `ON DELETE SET NULL`| In-flight queue deliveries decouple cleanly. |
| `LifeArea` | `Goal` | `ON DELETE SET NULL`| Deleting or archiving a life area preserves goals without orphaned crashes. |
| `LifeArea` | `Task` | `ON DELETE SET NULL`| Deleting a life area detaches tasks, preserving task execution records. |
| `Goal` | `GoalMetric` | `ON DELETE CASCADE` | Goal metrics belong exclusively to the parent goal. |
| `Goal` | `Task` | `ON DELETE SET NULL`| Deleting a goal leaves behavioral task history intact. |
| `GoalMetric` | `MetricObservation` | `ON DELETE CASCADE` | Raw measurements cascade with their metric definition. |
| `Routine` | `RoutineOccurrence` | `ON DELETE CASCADE` | Occurrences belong strictly to the routine template. |
| `Plan` | `Task` | `ON DELETE SET NULL`| Tasks retain history even if daily plan is cleared. |
| `Insight` | `Intervention` | `ON DELETE CASCADE` | Action recommendations depend on parent insight pattern. |
| `Conversation`| `Message` | `ON DELETE CASCADE` | Chat messages belong to conversation container. |

---

## 3. Soft Delete vs Hard Delete Strategy

1. **Life Areas**:
   - `LifeArea.isActive`: Set to `false` when a user hides or discontinues an area.
   - Preserves historical linkages with past goals, completed routines, and tasks.
2. **Goals**:
   - `Goal.status = ARCHIVED`: Goals are archived rather than deleted to maintain long-term habit velocity analytics.
3. **AI Memories**:
   - `Memory.status = REVOKED`: When a user revokes memory consent, the memory is marked `REVOKED` and immediately excluded from AI prompt context injection.
4. **Account Deletion (Hard Erasure)**:
   - When an account deletion is processed, `User` deletion triggers foreign key cascade across profile, sessions, devices, goals, tasks, routines, and memories, fulfilling statutory Right to Erasure.

---

## 4. Retention Windows

| Data Category | Retention Period | Purge Mechanism |
|---------------|------------------|-----------------|
| Expired Sessions | 30 days post-expiry | Automated background worker (`session-cleanup`) |
| Outbox Events (Status = PUBLISHED) | 7 days post-processing | Nightly partition/table trim |
| Outbox Events (Status = DEAD) | 90 days | SRE investigation buffer |
| Audit Logs | 365 days | Compliance log archive |
| Behavior Events | Indefinite (User lifetime) | Retained for growth trajectory intelligence |
