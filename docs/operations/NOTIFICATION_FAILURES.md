# SAAR Notification Delivery Failures & Invalidation Runbook

## 1. Notification Delivery Pipeline & Policies

SAAR push notifications are scheduled via database records (`Notification`) and processed asynchronously by `NotificationWorkerService` in `@saar/worker`.

### 1.1 Quiet Hours Policy
To respect user focus, sleep schedules, and local privacy expectations:
- Notifications that are not marked with priority `EMERGENCY` or `ALARM` must respect user quiet hours.
- If a notification's delivery timestamp falls within the user's defined quiet hours (e.g. 22:00 to 07:00 in user's local timezone), delivery is automatically deferred:
  - The notification status transitions to `SCHEDULED` with `scheduledAt` set to the end of the quiet hours period.
  - Alarms and critical safety interventions bypass quiet hours.

### 1.2 Idempotency Invariants
- Each notification has a unique `idempotencyKey` and `id`.
- Before invoking external notification providers (APNS / FCM), the worker checks the database record:
  ```typescript
  if (notification.status === 'SENT') {
    this.logger.log(`Notification ${notification.id} already delivered (idempotent skip).`);
    return;
  }
  ```
- If a delivery request is retried due to a transient network timeout after the provider has already dispatched the message, the worker's second attempt checks the state and halts without sending a duplicate push notification to the user's device.

---

## 2. Token Invalidation & Device Management

When a user uninstalls the app or revokes notification permissions, APNS and FCM return invalid token errors (`BadDeviceToken`, `Unregistered`, or `DeviceTokenNotForTopic`).

### 2.1 Automated Invalidation Flow
1. External push provider returns an error payload indicating unregistration:
   ```json
   {
     "success": false,
     "provider": "APNS",
     "invalidTokens": ["a1b2c3d4e5f6..."]
   }
   ```
2. `NotificationWorkerService` automatically deletes or deactivates the invalid device record:
   ```typescript
   if (result.invalidTokens && result.invalidTokens.length > 0) {
     await this.prisma.device.deleteMany({
       where: { pushToken: { in: result.invalidTokens } },
     });
     this.logger.warn(`Pruned ${result.invalidTokens.length} invalidated device tokens`);
   }
   ```
3. This prevents ongoing delivery failures, reduces outbound provider load, and keeps device registries clean.

---

## 3. Provider Outages & Rate Limiting

### 3.1 Rate Limiting (HTTP 429)
When Apple or Google returns `429 Too Many Requests`:
- The worker applies exponential backoff:
  ```typescript
  const retryAfterSeconds = parseRetryAfter(response.headers['retry-after']) || 60;
  await delay(retryAfterSeconds * 1000);
  ```
- Job is returned to the queue with a delayed execution timestamp.

### 3.2 Provider Down (HTTP 500 / 503)
- If provider endpoints return 5xx errors or connection timeouts:
  - The worker marks the notification as `FAILED`.
  - Retries up to 3 times before moving the notification job to the Dead-Letter queue.
  - System logs an alert to Ops with provider status.
