# SAAR — Developer Guide

> **S**elf-Aware **A**ction & **R**eflection — An AI-powered personal coaching platform that helps you turn life goals into consistent daily action.

---

## Table of Contents

1. [What is SAAR?](#1-what-is-saar)
2. [Architecture Overview](#2-architecture-overview)
3. [Prerequisites](#3-prerequisites)
4. [Quick Start](#4-quick-start)
5. [Running Tests](#5-running-tests)
6. [Environment Variables](#6-environment-variables)
7. [Database Management](#7-database-management)
8. [Project Structure](#8-project-structure)
9. [API Reference](#9-api-reference)
10. [Contributing & Git Workflow](#10-contributing--git-workflow)
11. [Troubleshooting](#11-troubleshooting)
12. [Architecture Decisions](#12-architecture-decisions)

---

## 1. What is SAAR?

SAAR is an AI-powered life coaching platform built on the premise that sustained
personal growth requires three things: **clarity** (knowing what matters), **action**
(breaking goals into daily tasks), and **reflection** (learning from patterns).

### Core Features (Phase 1)

| Feature                  | Description                                                  |
|--------------------------|--------------------------------------------------------------|
| **Life Areas**           | 6 canonical life domains with user-defined target states     |
| **Goals**                | SMART goals linked to life areas with metrics & target dates |
| **Tasks**                | Actionable steps linked to goals, with priority & due dates  |
| **Routines**             | Recurring habit blocks with RRULE scheduling                 |
| **Daily Check-ins**      | Mood + energy logs with highlights and blockers              |
| **AI Insights**          | Pattern analysis surfaced as actionable insights             |
| **Notifications**        | Server-scheduled, client-executed alarm system               |
| **Subscriptions**        | Freemium model with grace periods and platform-agnostic gating|

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  SAAR Monorepo (pnpm workspaces)                                     │
│                                                                       │
│  apps/                                                               │
│  ├── api/                NestJS REST API (primary)                   │
│  └── worker/             BullMQ background worker                    │
│                                                                       │
│  packages/                                                            │
│  ├── contracts/          Shared TypeScript interfaces & DTOs         │
│  ├── config/             Environment parsing & validation            │
│  └── logger/             Pino structured logger                      │
│                                                                       │
│  prisma/                                                              │
│  ├── schema.prisma       Database schema (PostgreSQL 16)             │
│  ├── migrations/         Versioned migration history                 │
│  └── seed/               Synthetic seed data                         │
│                                                                       │
│  docs/                                                                │
│  ├── adr/                Architecture Decision Records (ADR-001–010) │
│  ├── architecture/       System design documents                     │
│  ├── security/           Threat model                                │
│  └── runbooks/           Operational procedures                      │
└─────────────────────────────────────────────────────────────────────┘

External Services
┌───────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐
│ PostgreSQL │  │   Redis   │  │  OpenAI API  │  │ FCM / APNs       │
│  (port    │  │ (port     │  │  (AI coach,  │  │ (push notifs)    │
│   5432)   │  │  6379)    │  │   insights)  │  │                  │
└───────────┘  └───────────┘  └──────────────┘  └──────────────────┘
```

### Request Flow

```
Client → HTTPS → NestJS API → Guard (JWT) → Controller → Service → Prisma → PostgreSQL
                                                ↓
                                           OutboxEvent (same tx)
                                                ↓
                                      OutboxPublisher (2s poll)
                                                ↓
                                      EventEmitter2 / BullMQ
                                                ↓
                               AiCoreModule / NotificationsModule
```

---

## 3. Prerequisites

| Tool         | Minimum Version | Install                                              |
|--------------|-----------------|------------------------------------------------------|
| **Node.js**  | 24.x            | [nodejs.org](https://nodejs.org) or `nvm install 24` |
| **pnpm**     | 12.x            | `npm install -g pnpm@12`                             |
| **Docker**   | 24+             | [docker.com/get-started](https://www.docker.com/get-started) |
| **Git**      | 2.40+           | [git-scm.com](https://git-scm.com/)                 |

### Verify your environment

```bash
node  --version   # v24.x.x
pnpm  --version   # 12.x.x
docker --version  # Docker version 24+
git   --version   # git version 2.40+
```

---

## 4. Quick Start

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-org/saar.git
cd saar
```

### Step 2 — Configure environment

```bash
cp .env.example .env
```

> **Edit `.env` now.** At minimum, set `AI_API_KEY` if you want AI features. All
> other defaults work for local development.

### Step 3 — Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

Wait ~5 seconds for the services to be ready:

```bash
docker compose ps   # Both should show "healthy"
```

### Step 4 — Install dependencies

```bash
pnpm install
```

### Step 5 — Run database migrations

```bash
pnpm db:migrate
```

### Step 6 — Seed the database

```bash
pnpm db:seed
```

This creates a demo user (`demo@saar.dev`, password: `SaarDemo#2027!`) with sample
life areas, goals, tasks, and an insight. No real data, synthetic only.

### Step 7 — Start the development server

```bash
pnpm dev
```

The API is now running at: **http://localhost:3000**

Test it:
```bash
curl http://localhost:3000/health
# {"status":"ok"}

curl http://localhost:3000/api/v1/meta
# {"app":"SAAR","version":"1.0.0","phase":"1"}
```

---

## 5. Running Tests

### Unit tests

```bash
pnpm test
```

Unit tests use mocked Prisma and services. They run without a database.

### Unit tests with coverage

```bash
pnpm test:coverage
```

Coverage report is generated at `coverage/index.html`.

### Integration tests (requires Docker)

```bash
pnpm test:integration
```

Integration tests spin up an ephemeral test database on port 5433. Ensure Docker is
running. These tests use real Prisma queries against a test DB.

### Watch mode (during development)

```bash
pnpm test:watch
```

### Run a specific test file

```bash
pnpm test -- tasks.service.spec.ts
```

---

## 6. Environment Variables

Copy `.env.example` to `.env` before running locally. **Never commit `.env`.**

| Variable                        | Required    | Default (dev)                          | Description                                      |
|---------------------------------|-------------|----------------------------------------|--------------------------------------------------|
| `NODE_ENV`                      | Yes         | `development`                          | `development` / `test` / `staging` / `production` |
| `PORT`                          | No          | `3000`                                 | HTTP port the API listens on                     |
| `DATABASE_URL`                  | Yes         | `postgresql://saar:saar@localhost:5432/saar` | Prisma database connection string         |
| `REDIS_URL`                     | Yes         | `redis://localhost:6379`               | Redis connection string (BullMQ + cache)         |
| `JWT_SECRET`                    | Yes         | —                                      | HS256 signing secret for access tokens (32+ chars) |
| `JWT_REFRESH_SECRET`            | Yes         | —                                      | HS256 signing secret for refresh tokens (32+ chars) |
| `JWT_ACCESS_EXPIRES_IN`         | No          | `15m`                                  | Access token TTL (e.g. `15m`, `1h`)              |
| `JWT_REFRESH_EXPIRES_IN`        | No          | `30d`                                  | Refresh token TTL (e.g. `30d`)                   |
| `ENCRYPTION_KEY`                | Yes         | —                                      | 32-byte hex key for AES-256 field encryption      |
| `AI_PROVIDER`                   | No          | `openai`                               | `openai` / `anthropic` / `gemini` / `local`       |
| `AI_API_KEY`                    | Yes*        | —                                      | API key for the selected AI provider (*required for AI features) |
| `AI_MODEL_INSIGHT`              | No          | `gpt-4o-mini`                          | Model used for insight generation                |
| `AI_MODEL_COACHING`             | No          | `gpt-4o`                               | Model used for coaching chat sessions            |
| `AI_MODEL_DECOMPOSE`            | No          | `gpt-4o-mini`                          | Model used for goal decomposition                |
| `AI_MAX_TOKENS_FREE`            | No          | `50000`                                | Daily token budget per free user                 |
| `AI_MAX_TOKENS_PREMIUM`         | No          | `500000`                               | Daily token budget per premium user              |
| `FCM_SERVER_KEY`                | No          | —                                      | Firebase Cloud Messaging server key (push notifs)|
| `APNS_KEY_ID`                   | No          | —                                      | Apple Push Notification key ID                   |
| `APNS_TEAM_ID`                  | No          | —                                      | Apple Developer team ID                          |
| `STRIPE_SECRET_KEY`             | No          | —                                      | Stripe secret key (web subscriptions)            |
| `STRIPE_WEBHOOK_SECRET`         | No          | —                                      | Stripe webhook signing secret                    |
| `OUTBOX_POLL_INTERVAL_MS`       | No          | `2000`                                 | Outbox publisher polling interval (milliseconds) |
| `OUTBOX_MAX_ATTEMPTS`           | No          | `10`                                   | Max delivery attempts before DEAD status         |
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | No          | —                                      | OpenTelemetry collector endpoint (empty = disabled) |
| `OTEL_SERVICE_NAME`             | No          | `saar-api`                             | Service name in traces and metrics               |
| `OTEL_TRACES_SAMPLER_ARG`       | No          | `1`                                    | Trace sampling rate (0.0–1.0)                    |
| `LOG_LEVEL`                     | No          | `info`                                 | Pino log level: `trace` / `debug` / `info` / `warn` / `error` |
| `CORS_ORIGINS`                  | No          | `http://localhost:*`                   | Comma-separated allowed CORS origins             |
| `RATE_LIMIT_TTL`                | No          | `60`                                   | Rate limit window in seconds                     |
| `RATE_LIMIT_MAX`                | No          | `100`                                  | Max requests per window per IP                   |

---

## 7. Database Management

### Run pending migrations

```bash
pnpm db:migrate
# Applies all pending migrations using `prisma migrate deploy`
```

### Create a new migration

```bash
pnpm db:migrate:dev --name add_task_completed_note
# Creates: prisma/migrations/TIMESTAMP_add_task_completed_note/migration.sql
```

> ⚠️ Always create a `down.sql` alongside every migration for rollback capability.
> See [ADR-010](docs/adr/ADR-010-deployment-rollback.md) for migration rules.

### Reset the database (dev only — DESTRUCTIVE)

```bash
pnpm db:reset
# Drops all tables, re-runs all migrations, re-seeds
```

### Open Prisma Studio (visual DB browser)

```bash
pnpm db:studio
# Opens http://localhost:5555
```

### Seed the database

```bash
pnpm db:seed
# Runs prisma/seed/index.ts — synthetic data, safe to re-run (upserts)
```

### Check migration status

```bash
pnpm exec prisma migrate status
```

---

## 8. Project Structure

```
saar/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI: lint, typecheck, test, build, migration check
│       ├── deploy-staging.yml        # Auto-deploy to staging on push to develop
│       └── deploy-production.yml     # Manual-only production deploy with approval gate
│
├── apps/
│   ├── api/                          # NestJS REST API
│   │   ├── src/
│   │   │   ├── main.ts               # Bootstrap: OTEL init, NestFactory, global pipes
│   │   │   ├── app.module.ts         # Root module
│   │   │   └── modules/
│   │   │       ├── auth/             # AuthModule: login, refresh, logout, guards
│   │   │       ├── users/            # UsersModule: profile, memory management
│   │   │       ├── life-areas/       # LifeAreasModule: CRUD life areas
│   │   │       ├── goals/            # GoalsModule: goals + metrics
│   │   │       ├── tasks/            # TasksModule: tasks + completion
│   │   │       ├── routines/         # RoutinesModule: routines + RRULE
│   │   │       ├── checkins/         # CheckinsModule: daily check-in
│   │   │       ├── insights/         # InsightsModule: AI insight generation
│   │   │       ├── ai-core/          # AiCoreModule: LLM adapter + policy pipeline
│   │   │       ├── notifications/    # NotificationsModule: schedule + sync
│   │   │       ├── subscriptions/    # SubscriptionsModule: entitlements + webhooks
│   │   │       └── outbox/           # OutboxModule: event relay publisher
│   │   └── test/
│   │       ├── unit/                 # Jest unit tests (mocked)
│   │       └── integration/          # Supertest integration tests (real DB)
│   │
│   └── worker/                       # BullMQ worker process
│       └── src/
│           ├── main.ts
│           └── processors/
│               ├── ai-jobs.processor.ts
│               └── notification.processor.ts
│
├── packages/
│   ├── contracts/                    # Shared interfaces, DTOs, enums
│   ├── config/                       # env parsing (zod schema)
│   └── logger/                       # Pino logger factory
│
├── prisma/
│   ├── schema.prisma                 # Source of truth for DB schema
│   ├── migrations/                   # Generated migration history
│   └── seed/
│       └── index.ts                  # Synthetic seed script
│
├── docs/
│   ├── adr/                          # ADR-001 through ADR-010
│   ├── architecture/
│   │   └── overview.md               # Tech stack, module diagram
│   ├── security/
│   │   └── threat-model.md           # STRIDE threat model
│   ├── runbooks/
│   │   ├── local-setup.md            # New dev onboarding
│   │   └── database-migrations.md    # Migration procedures
│   └── implementation/
│       └── PHASE_1_AUDIT.md          # Phase 1 build audit
│
├── docker-compose.yml                # PostgreSQL + Redis for local dev
├── .env.example                      # Environment variable template
├── .gitignore
├── pnpm-workspace.yaml
├── package.json                      # Root package.json with workspace scripts
├── tsconfig.base.json                # Shared TypeScript config
└── README.md                         # This file
```

---

## 9. API Reference

### Health & Meta

| Method | Path              | Auth | Description                          |
|--------|-------------------|------|--------------------------------------|
| `GET`  | `/health`         | None | Liveness probe — always 200          |
| `GET`  | `/ready`          | None | Readiness probe — checks DB + Redis  |
| `GET`  | `/api/v1/meta`    | None | App name, version, phase             |

### Authentication

| Method   | Path                        | Auth         | Description                              |
|----------|-----------------------------|--------------|------------------------------------------|
| `POST`   | `/api/v1/auth/register`     | None         | Create account (email + password)        |
| `POST`   | `/api/v1/auth/login`        | None         | Login — returns access + refresh tokens  |
| `POST`   | `/api/v1/auth/refresh`      | Refresh token| Rotate refresh token, new access token   |
| `POST`   | `/api/v1/auth/logout`       | JWT          | Revoke current session                   |
| `GET`    | `/api/v1/auth/sessions`     | JWT          | List active sessions                     |
| `DELETE` | `/api/v1/auth/sessions/:id` | JWT          | Revoke a specific session                |

### Users

| Method | Path                       | Auth | Description                 |
|--------|----------------------------|------|-----------------------------|
| `GET`  | `/api/v1/users/me`         | JWT  | Get current user profile    |
| `PATCH`| `/api/v1/users/me`         | JWT  | Update profile / preferences|
| `GET`  | `/api/v1/users/me/memory`  | JWT  | List AI memory facts        |
| `DELETE`| `/api/v1/users/me/memory/:id`| JWT | Revoke a memory fact      |

### Life Areas, Goals, Tasks, Routines, Check-ins, Insights, Notifications

All follow standard REST conventions under `/api/v1/{resource}`. Full OpenAPI spec
is generated at **`GET /api/v1/docs`** (Swagger UI) when `NODE_ENV !== 'production'`.

---

## 10. Contributing & Git Workflow

### Branch naming

```
feature/<ticket>-short-description
fix/<ticket>-short-description
chore/<ticket>-short-description
docs/<ticket>-short-description
```

### Commit convention (Conventional Commits)

```
feat(tasks): add task completion with goal progress rollup
fix(auth): prevent refresh token reuse on concurrent requests
chore(ci): pin TruffleHog action to specific SHA
docs(adr): add ADR-011 for search strategy
```

### Pull Request rules

1. All CI checks must pass (lint, typecheck, tests, build, migration check).
2. No `console.log` in source code (Pino logger only).
3. Every new migration must include a `down.sql`.
4. Secret scan must pass — no credentials in diff.
5. PR description must reference the issue/ticket.

### Release process

- `develop` → staging (automatic on merge)
- `main` ← `develop` (squash merge, creates release)
- Production deploy is manual (see [ADR-010](docs/adr/ADR-010-deployment-rollback.md))

---

## 11. Troubleshooting

### `Error: ECONNREFUSED localhost:5432`
PostgreSQL is not running. Run: `docker compose up -d`

### `Error: P1001: Can't reach database server`
Check `DATABASE_URL` in `.env`. Run: `docker compose ps` to verify the container is healthy.

### `Error: PrismaClientKnownRequestError: relation "xxx" does not exist`
Migrations haven't run. Run: `pnpm db:migrate`

### `pnpm: command not found`
Install pnpm: `npm install -g pnpm@12`

### Port 3000 already in use
Change the port: set `PORT=3001` in `.env`, then `pnpm dev`

### `JWT_SECRET must be at least 32 characters`
Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in `.env` with 32+ character strings.

### Redis connection refused on port 6379
Redis container isn't running. Run: `docker compose up -d redis`

### `pnpm install` fails with lockfile mismatch
Run: `pnpm install --no-frozen-lockfile` (then commit the updated lockfile)

### Tests fail with `Can't find module '@prisma/client'`
Run: `pnpm exec prisma generate`

### `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` (corporate proxy)
Set: `NODE_EXTRA_CA_CERTS=/path/to/corporate-cert.pem` in your shell profile.

---

## 12. Architecture Decisions

All significant technical decisions are documented as ADRs in [`docs/adr/`](docs/adr/):

| ADR | Title |
|-----|-------|
| [ADR-001](docs/adr/ADR-001-modular-monolith.md) | Modular Monolith vs Microservices |
| [ADR-002](docs/adr/ADR-002-auth-session-strategy.md) | Authentication & Session Strategy |
| [ADR-003](docs/adr/ADR-003-postgresql-prisma.md) | PostgreSQL + Prisma as Data Foundation |
| [ADR-004](docs/adr/ADR-004-event-outbox-architecture.md) | Transactional Outbox Pattern for Events |
| [ADR-005](docs/adr/ADR-005-ai-provider-abstraction.md) | AI Provider Abstraction Layer |
| [ADR-006](docs/adr/ADR-006-memory-retention.md) | Memory Retention & User Control |
| [ADR-007](docs/adr/ADR-007-notification-alarm.md) | Notification & Alarm Platform Strategy |
| [ADR-008](docs/adr/ADR-008-subscription-entitlement.md) | Subscription & Entitlement Model |
| [ADR-009](docs/adr/ADR-009-observability.md) | Observability & Incident Response |
| [ADR-010](docs/adr/ADR-010-deployment-rollback.md) | Production Deployment & Rollback |

---

## License

SAAR is proprietary software. All rights reserved. See [LICENSE](LICENSE) for details.

---

*Last updated: 2026-09-23 · Phase 1*
