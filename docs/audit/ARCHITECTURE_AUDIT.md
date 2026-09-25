# SAAR Architecture Audit

**Author:** Principal Software Architect & CTO-Level Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Audit Scope:** System Architecture, Monorepo Topology, Domain Decoupling, Product Loop Integrity  

---

## 1. Executive Summary

This architecture audit provides an exhaustive forensic examination of the SAAR codebase. The project is structured as a TypeScript monorepo managed via Turborepo and pnpm workspaces. The intended core value proposition is an end-to-end Personal Growth Intelligence system executing a continuous feedback loop:

```
Future Self ──▶ Life Areas ──▶ Goals ──▶ Plans ──▶ Tasks ──▶ Behavior Events ──▶ Analytics ──▶ Feedback / Recalibration
```

Our forensic inspection confirms that while the structural scaffolding (monorepo layout, Next.js web application, NestJS API application, Expo/React Native mobile client, and shared packages) exists, there is severe **architectural drift** between design specifications and implementation reality. The system suffers from broken event-driven pipelines, bypassing of domain aggregate roots, synchronization fractures between frontend and backend contracts, and structural bottlenecks in asynchronous processing.

---

## 2. Monorepo Topology & Module Boundaries

### 2.1 Workspace Structure

```
saar/
├── apps/
│   ├── api/          # NestJS 10.4.4 API Server (Express adapter, Prisma ORM, Passport)
│   ├── web/          # Next.js 14.2.13 (App Router, Tailwind CSS, Lucide, Framer Motion)
│   └── mobile/       # Expo 51 / React Native 0.74.5 (Expo Router, SecureStore)
├── packages/
│   ├── contracts/    # Zod schemas, TypeScript request/response contracts
│   ├── domain/       # Domain entities, value objects, business rule definitions
│   ├── ai-core/      # LLM provider abstractions, prompt templates (partially stubbed)
│   ├── analytics/    # Behavioral telemetry schemas and aggregators
│   ├── config/       # Shared ESLint, Prettier, and TypeScript configurations
│   └── ui/           # Shared React UI components (Radix primitives, Tailwind)
├── prisma/           # PostgreSQL schema (20 models), migrations, seed scripts
└── infra/            # Docker Compose definitions (Postgres, Redis)
```

### 2.2 Dependency Graph & Enforced Boundaries

Turborepo (`turbo.json`) orchestrates the dependency graph:
- `build`: depends on `^build`
- `lint`: independent per package
- `typecheck`: depends on `^build`
- `test`: depends on `^build`

#### Forensic Finding: Dependency Inversion Violation & Domain Layer Bypass
- **Evidence:** In `apps/api/src/modules/goals/goals.service.ts`, `tasks.service.ts`, and `future-self.service.ts`, the NestJS application services directly invoke `@prisma/client` models, completely bypassing the rich domain model declared in `packages/domain/src/`.
- **Impact:** The domain logic in `packages/domain` is an **orphaned abstraction layer**. Business rule invariants (e.g., maximum concurrent active goals per life area, valid state transitions for tasks, milestone completion cascading) are duplicated or omitted across NestJS services and database triggers.
- **Architectural Risk:** The application lacks a Domain-Driven Design (DDD) anti-corruption layer. Any change to the database schema directly alters API service behavior without domain validation.

---

## 3. Product Loop Forensic Trace

The platform's primary product loop was forensically traced through the codebase to verify end-to-end executable viability:

| Product Stage | Theoretical Design Spec | Implemented Code Reality | Status | Evidence / File Path |
|---|---|---|---|---|
| **1. Future Self** | Vivid visioning, multidimensional identity mapping (1y, 5y, 10y) | Implemented in Prisma & API (`FutureSelf`, `FutureSelfDimension`). Controller endpoints functional. | **Functional** | `apps/api/src/modules/future-self/` |
| **2. Life Areas** | 8 foundational life pillars, baseline scores, balance scoring | Fully mapped with Prisma model, seeded with 8 standard pillars. Services enforce ownership. | **Functional** | `apps/api/src/modules/life-areas/` |
| **3. Goals** | Target outcomes linked to Life Areas, metrics, deadlines, milestones | CRUD implemented. State transitions (`NOT_STARTED` -> `IN_PROGRESS` -> `COMPLETED`) lack guard invariants. | **Partially Functional** | `apps/api/src/modules/goals/` |
| **4. Plans** | Structured milestone breakdowns & action sequences | Models exist in schema (`Plan`, `PlanStep`). However, API controller for direct plan generation is unexposed. | **Gapped** | `prisma/schema.prisma:186-218` |
| **5. Tasks** | Atomic daily executable actions linked to Goals & Plans | CRUD, filtering by status, priority, due date. Subtask cascading functional. | **Functional** | `apps/api/src/modules/tasks/` |
| **6. Behavior Events** | Event telemetry tracking actions, routines, time tracking | Implemented in `apps/api/src/modules/behavior-events/`. Writes to `BehaviorEvent` and `OutboxEvent`. | **Decoupled / Broken** | `apps/api/src/modules/behavior-events/` |
| **7. Analytics & AI** | Correlation engine, drift detection, proactive intervention | `packages/ai-core` and `packages/analytics` exist as stubs/types. No scheduled background processing. | **Dead-End** | `packages/ai-core/src/`, `packages/analytics/src/` |

---

## 4. Key Architectural Flaws Identified

### 4.1 Dead-End Outbox Pattern (`P1-EVENT-001`)
- **Location:** `apps/api/src/modules/behavior-events/behavior-events.service.ts:49-58`
- **Code Inspection:**
  ```typescript
  await tx.outboxEvent.create({
    data: {
      eventType: event.eventType,
      payload: event.payload as Prisma.InputJsonValue,
      status: 'PENDING',
    },
  });
  ```
- **Finding:** The application writes every incoming behavioral telemetry event to an `OutboxEvent` table with status `'PENDING'`. However, **there is zero outbox consumer, background worker, or scheduler anywhere in the repository**.
- **Architectural Consequence:**
  1. The `OutboxEvent` table accumulates unbounded rows in PostgreSQL, bloating storage and index size.
  2. Events are never relayed to Redis, Kafka, or background analytics workers.
  3. The downstream analytics engine is starved of real-time event feeds.

### 4.2 State Machine Invariant Leaks
- **Location:** `apps/api/src/modules/tasks/tasks.service.ts:133-157` & `goals.service.ts`
- **Finding:** State changes for tasks (`PENDING` -> `IN_PROGRESS` -> `COMPLETED` -> `ARCHIVED`) allow arbitrary transitions. A client can update a task directly from `COMPLETED` to `IN_PROGRESS` or `PENDING` without resetting completion timestamps, leading to corrupted velocity metrics and historical completion distortion.

### 4.3 Missing Asynchronous Processing Queue
- Despite Redis being defined in `infra/docker/docker-compose.yml`, the NestJS API has **no BullMQ or message queue module integrated**. Heavy computations (e.g., identity score recalculation, analytics aggregations, AI prompt generation) are executed synchronously inside HTTP request cycles, exposing the API to thread-pool starvation and high p99 latency spikes.

---

## 5. Architectural Remediation Roadmap

1. **Implement Domain Bridge Pattern:**
   Connect `packages/domain` value objects and state machines to `apps/api` service layers before persistence operations.
2. **Implement Outbox Worker:**
   Deploy a NestJS cron job or BullMQ worker (`@nestjs/schedule` or `bullmq`) to process `OutboxEvent` records in batches, dispatching them to Redis Pub/Sub and marking status `'PROCESSED'`.
3. **Formalize State Machines:**
   Define transition matrices in `@saar/contracts` and `@saar/domain` to strictly guard task and goal status changes.
4. **Queue Offloading:**
   Offload behavior event ingestion and analytics aggregation to BullMQ background workers.
