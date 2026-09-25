# SAAR Comprehensive Forensic Risk Register

**Author:** Principal Software Architect, Security Engineer & CTO-Level Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Full-Stack Enterprise Risk Assessment  

---

## 1. Risk Register Summary

| Severity Tier | Definition | Total Count |
|---|---|:---:|
| **P0 — CRITICAL** | System-breaking flaw, severe security exploit, data loss, or total service outage. Must be resolved prior to any production deployment. | **5** |
| **P1 — HIGH** | Major architectural gap, token exposure, significant latency degradation, or testing invalidation. | **7** |
| **P2 — MEDIUM** | Sub-optimal performance, missing telemetry, API contract drift, or nested authorization flaws. | **6** |
| **P3 — LOW** | Code style, minor configuration enhancements, or future-proofing tasks. | **2** |
| **TOTAL** | **All Discovered Vulnerabilities & Engineering Risks** | **20** |

---

## 2. P0 — Critical Risks (Immediate Release Blockers)

### [P0-SEC-001] Complete CORS Authorization Bypass via Logic Fallthrough
- **Category:** Security / Transport
- **Root Cause & Code Location:** `apps/api/src/main.ts:32-45`. The CORS callback `else` block unconditionally executes `callback(null, true)` with `credentials: true`.
- **Technical & Business Impact:** Universal Same-Origin Policy (SOP) bypass. Any malicious third-party website can issue authenticated cross-origin requests to read private user profiles, goals, and tasks.
- **Likelihood:** High | **Severity:** Critical
- **Remediation:** Update `else` branch to call `callback(new Error('Not allowed by CORS'), false)`.
- **Owner:** Backend Security

### [P0-SEC-002] Inactive Rate Limiting via Unbound ThrottlerGuard
- **Category:** Security / DoS Prevention
- **Root Cause & Code Location:** `apps/api/src/app.module.ts:18-35`. `ThrottlerModule` is imported, but `ThrottlerGuard` is never registered in `providers` via `APP_GUARD`.
- **Technical & Business Impact:** `@Throttle()` decorators on `/auth/login` and `/auth/register` are completely inert. Vulnerable to unlimited credential stuffing, brute-force attacks, and server resource exhaustion.
- **Likelihood:** High | **Severity:** Critical
- **Remediation:** Bind `ThrottlerGuard` to `APP_GUARD` in `AppModule.providers`.
- **Owner:** Backend Security

### [P0-AUTH-001] Algorithmic CPU Denial of Service & Silent 401 Cap on Token Refresh
- **Category:** Authentication / Scalability
- **Root Cause & Code Location:** `apps/api/src/modules/auth/auth.service.ts:258-273`. Opaque refresh tokens force an unindexed query of up to 200 sessions, followed by an sequential loop verifying compute-heavy Argon2id hashes.
- **Technical & Business Impact:**
  1. Verifying 200 hashes consumes 10–20 seconds of CPU, freezing Node.js event loops.
  2. Users whose sessions exceed the top 200 rows fail refresh with 401 Unauthorized and are booted.
- **Likelihood:** High | **Severity:** Critical
- **Remediation:** Restructure refresh tokens to include `<sessionId>.<tokenSecret>` for $O(1)$ database lookup.
- **Owner:** Identity & Backend

### [P0-MOB-001] Mobile Authentication Route 404 & Response Payload Crash
- **Category:** Mobile / Client Integration
- **Root Cause & Code Location:** `apps/mobile/context/AuthContext.tsx:67-96`. Calls non-existent `/auth/me` (404) and parses `res.accessToken` directly instead of `res.session.accessToken`.
- **Technical & Business Impact:** 100% crash and forced logout of every mobile user immediately on app boot. Mobile client is completely non-functional.
- **Likelihood:** Certain | **Severity:** Critical
- **Remediation:** Route to `/api/v1/users/me` and parse nested `res.session` structure.
- **Owner:** Mobile Engineering

### [P0-DB-001] Broken Database Seed Script Crashes Fresh Deployments
- **Category:** Database / Developer Operations
- **Root Cause & Code Location:** `prisma/seed/index.ts:53-63`. `prisma.user.upsert` passes non-existent fields `displayName` and `isEmailVerified` to the `User` model.
- **Technical & Business Impact:** `pnpm db:seed` crashes with `PrismaClientValidationError`. New developer environments, staging databases, and automated CI test setups cannot be initialized.
- **Likelihood:** Certain | **Severity:** Critical
- **Remediation:** Populate `UserProfile` relation via nested `profile: { create: { displayName: ... } }`.
- **Owner:** Database Engineering

---

## 3. P1 — High Risks

### [P1-SEC-001] Client-Side Token Exposure in `localStorage` & Non-HttpOnly Cookies
- **Category:** Security / Session Storage
- **Location:** `apps/web/app/(auth)/login/page.tsx:98-116`.
- **Impact:** Any XSS vulnerability allows complete session token theft.
- **Remediation:** Deliver session tokens via backend `Set-Cookie: HttpOnly; Secure; SameSite=Strict`.

### [P1-AUTH-001] Stateless JWT Revocation Blindness
- **Category:** Authentication / Session Lifecycle
- **Location:** `apps/api/src/modules/auth/strategies/jwt.strategy.ts:37-42`.
- **Impact:** Logged-out or suspended users retain active API access for up to 15 minutes.
- **Remediation:** Add Redis or in-memory session revocation blacklist check in `JwtStrategy`.

### [P1-AUTH-002] Web Client Discards Refresh Token
- **Category:** Web Client / Authentication
- **Location:** `apps/web/app/(auth)/login/page.tsx` & `api-client.ts`.
- **Impact:** Web users are abruptly logged out every 15 minutes upon access token expiration.
- **Remediation:** Store refresh token in HttpOnly cookie and implement automatic 401 retry interceptor.

### [P1-EVENT-001] Dead-End Outbox Pattern Bloating Database
- **Category:** Architecture / Event Pipelines
- **Location:** `apps/api/src/modules/behavior-events/behavior-events.service.ts:49-58`.
- **Impact:** Unbounded accumulation of rows in `OutboxEvent`; downstream analytics engine is unpowered.
- **Remediation:** Deploy BullMQ background worker to process and purge outbox events.

### [P1-INFRA-001] Total Absence of Production Application Dockerfiles
- **Category:** Infrastructure / Containerization
- **Location:** `infra/` & monorepo root.
- **Impact:** Inability to deploy standardized containerized builds to ECS, Cloud Run, or Kubernetes.
- **Remediation:** Create multi-stage production Dockerfiles for `apps/api` and `apps/web`.

### [P1-CI-001] CI Pipeline Environment Variable Schema Mismatch
- **Category:** CI/CD / Release Automation
- **Location:** `.github/workflows/ci.yml:47`.
- **Impact:** CI defines `JWT_SECRET` instead of mandatory `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, failing Joi validation if the API context is initialized in CI.
- **Remediation:** Update GitHub Actions environment variables to match `env.validation.ts`.

### [P1-TEST-001] Real Database Integration Testing Completely Missing
- **Category:** Quality Assurance / Testing
- **Location:** `apps/api/test/health.integration.ts`.
- **Impact:** Integration tests mock Prisma. No tests run against real PostgreSQL; database schema migrations and constraints are completely unverified by CI.
- **Remediation:** Provision PostgreSQL service container in GitHub Actions and run tests against real DB.

---

## 4. P2 — Medium Risks

| Risk ID | Title | File / Location | Remediation |
|---|---|---|---|
| **P2-SEC-001** | Permissive Vercel Subdomain Wildcard | `main.ts:38` | Replace `.endsWith('.vercel.app')` with exact project domain whitelist. |
| **P2-AUTHZ-001**| Unbound RolesGuard Global Provider | `app.module.ts` | Register `RolesGuard` in `AppModule.providers` under `APP_GUARD`. |
| **P2-AUTHZ-002**| Nested IDOR on Subtask & Milestone Mutations | `tasks.service.ts:182`, `goals.service.ts:145` | Verify parent task/goal `userId` prior to updating nested records. |
| **P2-DB-001** | Missing Composite Indexes on High-Frequency Queries | `prisma/schema.prisma` | Add `@@index([userId, status, dueDate])` and `@@index([userId, date])`. |
| **P2-API-001** | Missing OpenAPI / Swagger Documentation | `apps/api/src/main.ts` | Install `@nestjs/swagger` and generate Swagger UI & OpenAPI JSON. |
| **P2-OBS-001** | Zero Prometheus Metrics & Sentry Crash Reporting | `apps/api/src/` | Install `@willsoto/nestjs-prometheus` and `@sentry/node`. |

---

## 5. P3 — Low Risks

| Risk ID | Title | File / Location | Remediation |
|---|---|---|---|
| **P3-SEC-001** | Missing Password Complexity Rules | `packages/contracts/src/auth.ts` | Enforce uppercase, lowercase, numbers, and special characters. |
| **P3-CODE-001**| Contract Drift Between Zod & Class-Validator DTOs | `packages/contracts` vs `apps/api` DTOs | Unify contracts using `nestjs-zod`. |
