# SAAR Technical Debt Register & Remediation Catalog

**Author:** Principal Software Architect & CTO-Level Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Architecture Debt, Security Debt, Codebase Debt, Testing Debt, Infrastructure Debt  

---

## 1. Executive Summary

This Technical Debt Register catalogs all known technical debt across the SAAR monorepo, prioritizing items by engineering effort versus business and technical impact.

---

## 2. Technical Debt Matrix (Effort vs. Impact)

```
       ▲ HIGH
       │  [P0-AUTH-001] Session Refactor    [P1-INFRA-001] Production Docker
       │  [P0-SEC-001] CORS Patch           [P1-EVENT-001] BullMQ Outbox Worker
IMPACT │  [P0-SEC-002] Throttler Bind       [P1-TEST-001] Live DB Integration Tests
       │  [P0-DB-001] Seed Correction       [P1-ARCH-001] Domain Layer Unification
       │  [P0-MOB-001] Mobile Auth Sync     [P2-OBS-001] Prometheus & Sentry
       │────────────────────────────────────────────────────────────────────────►
       │  LOW EFFORT                       HIGH EFFORT
```

---

## 3. Detailed Technical Debt Catalog

### 3.1 Architectural Debt
1. **Domain Abstraction Layer Bypass (`TECH-ARCH-01`):**
   - *Description:* `apps/api` services query `@prisma/client` directly, leaving `packages/domain` entities and value objects unused.
   - *Impact:* High. Business rule invariants are fragmented across controllers, services, and raw SQL.
   - *Effort:* Medium.
   - *Remediation:* Implement domain repository interfaces in `packages/domain` and adapt Prisma services as repository implementations.

2. **Dead-End Outbox Pattern (`TECH-ARCH-02`):**
   - *Description:* Telemetry events are inserted into `OutboxEvent` with status `'PENDING'`, but no worker exists to read, publish, or purge them.
   - *Impact:* High. Postgres storage accumulates dead records; analytics remain unpowered.
   - *Effort:* Medium.
   - *Remediation:* Deploy BullMQ worker with a scheduled cron or stream listener to process pending outbox events.

### 3.2 Security & Authentication Debt
1. **O(N) Refresh Token Loop (`TECH-SEC-01`):**
   - *Description:* Opaque refresh token verified against up to 200 sessions using Argon2.
   - *Impact:* Critical. CPU denial of service, silent session terminations.
   - *Effort:* Low. Prepend `sessionId` to refresh tokens (`<sessionId>.<token>`).

2. **CORS Logic Fallthrough (`TECH-SEC-02`):**
   - *Description:* Fallthrough `else` branch calls `callback(null, true)`.
   - *Impact:* Critical. Full SOP bypass for authenticated requests.
   - *Effort:* Low. Call `callback(new Error('Not allowed by CORS'), false)`.

3. **Rate Limiting Inactivity (`TECH-SEC-03`):**
   - *Description:* `ThrottlerGuard` is not bound to `APP_GUARD`.
   - *Impact:* Critical. Brute-force attacks against `/auth/login` and `/auth/register` are unchecked.
   - *Effort:* Low. Register provider in `AppModule`.

4. **Client-Side Token Exposure (`TECH-SEC-04`):**
   - *Description:* Web frontend writes access tokens to `localStorage` and non-HttpOnly cookies.
   - *Impact:* High. XSS token theft vulnerability.
   - *Effort:* Medium. Issue HttpOnly, Secure session cookies from backend.

### 3.3 Codebase & Contract Debt
1. **Contract Schema Duplication (`TECH-CODE-01`):**
   - *Description:* Zod schemas in `@saar/contracts` are manually rewritten as `class-validator` DTOs in `apps/api`.
   - *Impact:* Medium. Contract drift causes unexpected validation rejections for valid client payloads.
   - *Effort:* Medium. Use `nestjs-zod` or single-source code generators.

2. **Mobile API Route & Response Fracture (`TECH-CODE-02`):**
   - *Description:* Mobile app targets `/auth/me` (404) and expects flat `{ accessToken }` rather than `{ session: { accessToken } }`.
   - *Impact:* Critical. Mobile app crashes on launch.
   - *Effort:* Low. Align route and parse nested session response.

### 3.4 Database Debt
1. **Broken Seed Script (`TECH-DB-01`):**
   - *Description:* `prisma/seed/index.ts` passes `displayName` and `isEmailVerified` to `prisma.user.upsert`.
   - *Impact:* Critical. `pnpm db:seed` crashes with `PrismaClientValidationError`.
   - *Effort:* Low. Create profile relation properly.

2. **Missing Composite Indexes (`TECH-DB-02`):**
   - *Description:* `Task`, `Session`, `BehaviorEvent`, and `OutboxEvent` lack multi-column indexes matching query patterns.
   - *Impact:* High. Performance degradation at scale.
   - *Effort:* Low. Add composite index annotations to `prisma/schema.prisma`.

### 3.5 Testing & CI/CD Debt
1. **100% Mocked Integration Tests (`TECH-TEST-01`):**
   - *Description:* Integration tests mock Prisma rather than testing real SQL execution.
   - *Impact:* High. Database bugs escape to production.
   - *Effort:* Medium. Add live Postgres container in CI.

2. **CI Environment Variable Discrepancy (`TECH-CI-01`):**
   - *Description:* CI sets `JWT_SECRET` instead of `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
   - *Impact:* High. Prevents booting real API context in CI.
   - *Effort:* Low. Update GitHub Actions YAML.

---

## 4. Remediation Schedule (Sprint Plan)

- **Sprint 1 (Immediate - P0/P1 Blockers):**
  - Patch CORS, bind ThrottlerGuard, fix refresh token $O(1)$ lookup, fix mobile auth routes, fix Prisma seed script, sync CI environment variables.
- **Sprint 2 (P1 Hardening & Infrastructure):**
  - Multi-stage Dockerfiles, live PostgreSQL in CI, BullMQ outbox worker, composite database indexes.
- **Sprint 3 (P2 Polish & Observability):**
  - Prometheus metrics, Sentry alerting, TanStack Query on web frontend, OpenAPI/Swagger generation.
