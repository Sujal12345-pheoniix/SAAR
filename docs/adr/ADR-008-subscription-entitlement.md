# ADR-008: Subscription & Entitlement Model

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead, Product Lead            |

---

## Context

SAAR has a freemium business model with premium features gated behind a subscription.
Premium features include:

- Unlimited AI coaching sessions
- Advanced insight generation
- AI memory (long-term context)
- Unlimited goals and life areas
- Priority notification scheduling
- Data export

The subscription must be managed across multiple platforms (iOS App Store, Google Play,
web via Stripe). Each platform has its own payment processing, webhook behavior, and
refund policies.

### The Core Problem: Webhook Unreliability

Payment providers deliver subscription state changes via webhooks. But webhooks can:
- Arrive out of order (renewal before expiry)
- Be delayed by minutes or hours
- Be delivered multiple times (retry on provider side)
- Never arrive (network partition, provider bug)

If our entitlement state **is** the payment provider state, any of these failures
means users lose access to features they paid for, or retain access after cancellation.

### Options Considered

| Approach                                      | Pros                                 | Cons                                                    |
|-----------------------------------------------|--------------------------------------|---------------------------------------------------------|
| **Trust provider state directly**             | Simple                               | Fragile to webhook delays and failures                  |
| **Separate entitlement state + webhook events**| Robust, graceful degradation         | More complex, need reconciliation job                   |
| **Client-side receipt validation only**       | No backend needed                    | Trivially spoofable, no server-side feature gating      |
| **Third-party (RevenueCat, Adapty)**           | Pre-built, handles all platforms     | Vendor lock-in, cost, data leaves our infra             |

---

## Decision

**Entitlement state is separated from payment provider state. The server maintains its
own `subscriptions` and `entitlements` tables. Server-side feature gating on every
premium endpoint. Grace periods modeled explicitly. A reconciliation job syncs
entitlements with provider state periodically.**

### Data Model

```sql
-- Subscription record (one per user per platform)
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  platform          TEXT NOT NULL,       -- 'ios' | 'android' | 'stripe'
  plan_id           TEXT NOT NULL,       -- e.g. 'saar_premium_monthly'
  status            TEXT NOT NULL,       -- ACTIVE | CANCELLED | EXPIRED | GRACE | TRIAL | PAUSED
  provider_sub_id   TEXT NOT NULL,       -- Stripe subscription ID / Apple original_transaction_id
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  trial_end         TIMESTAMPTZ,
  grace_period_end  TIMESTAMPTZ,         -- NULL if no grace period
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entitlement (the feature access derived from subscription)
CREATE TABLE entitlements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  feature_key   TEXT NOT NULL,           -- e.g. 'ai_coaching' | 'unlimited_goals'
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  source        TEXT NOT NULL,           -- 'subscription' | 'trial' | 'promotional' | 'admin_grant'
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_entitlements_user_feature ON entitlements(user_id, feature_key);
```

### Feature Gate Implementation

Every premium endpoint uses an `EntitlementsGuard`:

```typescript
@UseGuards(JwtAuthGuard, EntitlementsGuard('ai_coaching'))
@Get('coaching/session')
async startSession(@CurrentUser() user: AuthUser) {
  // Only reachable if entitlement is active
}
```

The guard checks `entitlements` table — **not** the subscription table directly.
This separates the "is this user allowed?" question from "what is their payment state?".

### Entitlement Features

| feature_key          | Free Tier                    | Premium                          |
|----------------------|------------------------------|----------------------------------|
| `ai_coaching`        | 3 sessions/month             | Unlimited                        |
| `unlimited_goals`    | 3 goals max                  | Unlimited                        |
| `ai_memory`          | Not available                | Up to 100 memory facts           |
| `advanced_insights`  | 1 insight/week               | Daily insights                   |
| `data_export`        | Not available                | Full JSON/CSV export             |
| `priority_support`   | Community forum              | Email + chat within 24h          |

### Grace Period Logic

```
Subscription renewal fails (payment declined)
→ Set status = GRACE, grace_period_end = NOW() + 7 days
→ Entitlements remain ACTIVE during grace period
→ Send daily retry notification to user
→ If payment succeeds within grace → status = ACTIVE
→ If grace period expires → status = EXPIRED
   → Set all entitlements is_active = FALSE
   → Downgrade user to free tier features
```

### Webhook Processing (Idempotent)

All webhook events are stored in a `webhook_events` table before processing:

```sql
CREATE TABLE webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  provider_id   TEXT NOT NULL UNIQUE,   -- Provider's event ID for deduplication
  payload       JSONB NOT NULL,
  processed_at  TIMESTAMPTZ,
  error         TEXT,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Processing is idempotent: check `provider_id` exists before acting.

### Reconciliation Job

A daily cron job (02:00 UTC) reconciles entitlements with provider state:
- Fetch current subscription status from provider API
- Compare with local `subscriptions` table
- Correct any discrepancies
- Alert on unexplained mismatches

---

## Consequences

### Positive
- **Robust to webhook failures**: grace periods prevent false feature lockouts.
- **Idempotent webhook processing**: duplicate webhooks are safe.
- **Platform-agnostic feature gating**: works the same for iOS, Android, and web.
- **Promotional access**: `admin_grant` source allows manual entitlement for CS/refunds.

### Negative / Risks
- **Eventual consistency**: entitlements lag real payment state by up to reconciliation cycle.
  **Mitigation**: webhooks process in near-real-time; reconciliation is a safety net only.
- **Complexity**: two tables instead of one.
  **Mitigation**: `EntitlementsService` encapsulates all logic.

---

## References

- [RevenueCat Entitlements Model](https://www.revenuecat.com/docs/entitlements) — design reference
- [Stripe Subscription Webhooks](https://stripe.com/docs/billing/subscriptions/webhooks)
- [Apple In-App Purchase Server Notifications v2](https://developer.apple.com/documentation/appstoreservernotifications)
- [Google Play Billing — Real-time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)
