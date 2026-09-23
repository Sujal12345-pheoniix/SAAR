# SAAR Architecture Overview

> This document describes the technical architecture of SAAR Phase 1.
> For rationale behind each key decision, see the [ADR index](../adr/).

---

## 1. Tech Stack

| Layer                 | Technology                                        | Version  |
|-----------------------|---------------------------------------------------|----------|
| **Runtime**           | Node.js                                           | 24.x     |
| **API Framework**     | NestJS                                            | 10.x     |
| **Language**          | TypeScript                                        | 5.x      |
| **Package Manager**   | pnpm (workspaces)                                 | 12.x     |
| **Database**          | PostgreSQL                                        | 16       |
| **ORM**               | Prisma                                            | 5.x      |
| **Cache / Queue**     | Redis + BullMQ                                    | 7 / 5.x  |
| **Auth**              | JWT (HS256) + argon2id password hashing           | —        |
| **AI**                | OpenAI (primary), Anthropic/Gemini (adapters)     | —        |
| **Logging**           | Pino (structured JSON)                            | 9.x      |
| **Tracing**           | OpenTelemetry SDK                                 | 1.x      |
| **Testing**           | Jest + Supertest                                  | 29.x     |
| **CI/CD**             | GitHub Actions                                    | —        |
| **Containerization**  | Docker + Docker Compose                           | 24+      |

---

## 2. System Context

```
┌──────────────────────────────────────────────────────────────────┐
│  External Actors                                                   │
│                                                                    │
│  [Mobile App]     [Web App]     [Admin Panel]                     │
│      │                │               │                            │
│      └────────────────┼───────────────┘                           │
│                        │ HTTPS (TLS 1.3)                          │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │   SAAR API      │  NestJS on Node 24
                │  (port 3000)    │
                └────────┬────────┘
         ┌───────────────┼──────────────────┐
         │               │                  │
  ┌──────▼──────┐ ┌──────▼──────┐  ┌───────▼──────┐
  │ PostgreSQL  │ │    Redis     │  │ OpenAI API   │
  │   (5432)    │ │   (6379)    │  │ (external)   │
  └─────────────┘ └─────────────┘  └──────────────┘
         │                                  │
  ┌──────▼──────┐                  ┌───────▼──────┐
  │  Prisma ORM │                  │  ai-core     │
  │  (type-safe)│                  │  (adapter)   │
  └─────────────┘                  └──────────────┘
```

---

## 3. Module Architecture (NestJS)

Each domain is a standalone NestJS module with strict boundary enforcement.
No module imports another module's internal repositories or services directly.

```
AppModule
├── AuthModule           # JWT auth, refresh token rotation, session management
├── UsersModule          # User profile, preferences, AI memory management
├── LifeAreasModule      # 6 canonical life domains, target states
├── GoalsModule          # SMART goals, metrics, progress tracking
├── TasksModule          # Task CRUD, completion, priority management
├── RoutinesModule       # Recurring habit blocks, RRULE scheduling
├── CheckinsModule       # Daily mood/energy log, highlights, blockers
├── InsightsModule       # AI-generated pattern insights, dismissal/archiving
├── AiCoreModule         # LLM adapter + PII policy + rate limiting
├── NotificationsModule  # Rule storage, schedule sync endpoint, FCM/APNs push
├── SubscriptionsModule  # Entitlements, webhook processing, grace periods
├── OutboxModule         # Transactional outbox publisher (2s poll)
├── TelemetryModule      # OpenTelemetry initialization (loaded first)
├── HealthModule         # /health and /ready endpoints
└── CommonModule         # Guards, interceptors, decorators, filters
```

### Module Boundary Rules

1. A module may only import from:
   - Its own internal files
   - `packages/contracts` (shared interfaces/DTOs)
   - `packages/logger` and `packages/config`
   - Explicitly listed exported services from other modules
2. Repositories are `@Injectable()` but **never exported**.
3. Cross-module side effects go through the `OutboxModule` event bus.
4. `eslint-plugin-boundaries` enforces these rules in CI.

---

## 4. Data Flow: Task Completion

```
POST /api/v1/tasks/:id/complete
          │
          ▼
  JwtAuthGuard (validates access token, no DB hit)
          │
          ▼
  TasksController.completeTask()
          │
          ▼
  TasksService.completeTask()
          │
          ▼
  prisma.$transaction([
    task.update({ status: 'DONE', completedAt: now() }),
    outboxEvent.create({ type: 'task.completed', payload: {...} })
  ])    │
        │ atomic
        ▼
  [DB committed]
        │
        ▼  (2s later, OutboxPublisher polls)
  EventEmitter2.emit('task.completed', payload)
        │
        ├──► InsightsService.onTaskCompleted()
        │      └─ enqueue AI analysis job to BullMQ
        │
        └──► GoalsService.onTaskCompleted()
               └─ update goal progress aggregates
```

---

## 5. Authentication Flow

```
POST /auth/login { email, password }
  → argon2id.verify(storedHash, password)
  → Issue access_token (JWT, 15 min, HS256)
  → Issue refresh_token (64-byte random, opaque)
  → Store SHA-256(refresh_token) in refresh_tokens table
  → Return both tokens to client

POST /auth/refresh { refresh_token }
  → Compute SHA-256(refresh_token)
  → DB lookup: must exist, not expired, not revoked
  → Issue NEW access_token + NEW refresh_token
  → Revoke old refresh_token (rotation)
  → Detect reuse: if old token seen again → revoke entire family
```

---

## 6. AI Request Pipeline

```
Domain Service → AiCoreService.complete(request)
                       │
                       ├─ PiiRedactionPolicy   (strip PII from prompt)
                       ├─ ContentSafetyPolicy  (block injection)
                       ├─ RateLimitPolicy      (check token budget in Redis)
                       │
                       ▼
               [Selected Adapter: OpenAI / Anthropic / Gemini / Local]
                       │
                       ▼
               ResponsePolicy (validate, strip leaked PII)
                       │
                       ▼
               Log to OTEL (model, tokens, latency — NO prompt content)
                       │
                       ▼
               Return AiCompletionResponse to caller
```

---

## 7. Deployment Architecture (Phase 1)

```
GitHub ──push to develop──► deploy-staging.yml ──► Staging env (auto)
GitHub ──workflow_dispatch──► deploy-production.yml
                                    │
                         Manual approval (GitHub Environment)
                                    │
                         pnpm db:migrate (migrations first)
                                    │
                         Deploy new Docker image / serverless
                                    │
                         Health check: GET /ready
                                    │
                         Smoke test: GET /api/v1/meta
```

---

## 8. Key Design Principles

| Principle                   | Implementation                                                  |
|-----------------------------|------------------------------------------------------------------|
| **Privacy by design**       | Memory opt-in, PII redaction in logs, minimal data collection    |
| **Atomic mutations**        | Outbox pattern — DB write + event in one transaction             |
| **Separation of concerns**  | Entitlement table separate from subscription/payment state        |
| **Vendor flexibility**      | AI provider swappable via env var, no direct SDK calls in domain  |
| **Reversible changes**      | Migration rules enforce backward-compatible schema changes        |
| **Observable by default**   | Every request has a trace ID, structured logs, OTEL spans         |
| **Testable architecture**   | Modules designed for mockability; integration tests use real DB   |

---

## 9. Future Architecture (Phase 2+)

| Evolution                        | Trigger                                      |
|----------------------------------|----------------------------------------------|
| Extract `ai-core` as a service   | AI latency > 10s p99 affecting API p99       |
| Add Redis pub/sub or Kafka       | Fan-out events to > 10 consumers             |
| Blue-green deployments           | Revenue justifies zero-downtime requirement  |
| Feature flags (LaunchDarkly)     | > 3 features being A/B tested simultaneously |
| Read replicas                    | DB CPU > 70% during peak hours               |
| Microservices extraction         | > 4 independent backend teams                |

---

*Last updated: 2026-09-23 · Phase 1*
