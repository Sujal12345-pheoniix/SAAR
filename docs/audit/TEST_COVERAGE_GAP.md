# SAAR Test Coverage Gap & Blind Spot Analysis

**Author:** Principal QA Architect & Forensic Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Component Coverage Matrix, Untested Critical Paths, Boundary Condition Blind Spots  

---

## 1. Executive Summary

This document details the comprehensive testing blind spots across the SAAR monorepo. While `apps/api` has 40 passing unit tests for basic service CRUD functions, **critical infrastructure components, controllers, edge cases, error conditions, and the entirety of the web and mobile frontends have 0% automated test coverage**.

---

## 2. Monorepo Coverage Heatmap

| Monorepo Component | Unit Test Coverage | Integration Test Coverage | E2E Test Coverage | Coverage Grade |
|---|---|---|---|---|
| **API Services (Auth, Users, Goals, Tasks, etc.)** | ~65% (Mocked Prisma) | 0% | 0% | **C+** |
| **API Controllers (All 10 Controllers)** | 0% | ~10% (Health only) | 0% | **F** |
| **API Guards & Interceptors** | 0% | 0% | 0% | **F** |
| **Behavior Events & Outbox** | 0% | 0% | 0% | **F** |
| **Daily Growth Service** | 0% | 0% | 0% | **F** |
| **Database Migrations & Seed** | 0% | 0% | 0% | **F** (Broke silently) |
| **`@saar/contracts` (Zod Schemas)** | 0% | 0% | 0% | **F** |
| **`@saar/domain` (Entities & Invariants)** | 0% | 0% | 0% | **F** |
| **`@saar/ai-core` (LLM Orchestration)** | 0% | 0% | 0% | **F** |
| **`@saar/analytics` (Telemetry)** | 0% | 0% | 0% | **F** |
| **Web Frontend (`apps/web`)** | 0% | 0% | 0% | **F** |
| **Mobile Frontend (`apps/mobile`)** | 0% | 0% | 0% | **F** (Broke silently) |

---

## 3. High-Priority Testing Blind Spots

### 3.1 Untested Service Modules
- **`BehaviorEventsService` (`apps/api/src/modules/behavior-events/`):**
  - Completely untested.
  - The transaction writing to both `BehaviorEvent` and `OutboxEvent` has never been verified in code.
  - Batch event ingestion (`/api/v1/behavior-events/batch`) is unverified.
- **`DailyGrowthService` (`apps/api/src/modules/daily-growth/`):**
  - Completely untested.
  - Calculation of daily completion percentages, score aggregations, and streak counting are unverified.

### 3.2 Security & Authentication Blind Spots
- **Token Refresh Loop Edge Cases:**
  - Zero tests evaluate behavior when active sessions exceed 200.
  - Zero tests evaluate performance or CPU consumption under invalid token attacks.
- **Token Revocation Invariants:**
  - Zero tests assert that a revoked session token cannot be used to refresh.
  - Zero tests check behavior after `logout-all`.
- **CORS & Security Headers:**
  - Zero tests assert that unlisted cross-origin domains receive CORS rejection.

### 3.3 Database & Concurrency Gaps
- **Concurrent Task Status Updates:**
  - Zero tests simulate two simultaneous requests completing or archiving the same task.
- **PostgreSQL Unique Constraints:**
  - Zero tests verify database-level enforcement of unique email addresses or unique daily growth logs per date.

---

## 4. Remediation Prioritization

1. **Phase 1 (Immediate P0):**
   - Write unit tests for `BehaviorEventsService` and `DailyGrowthService`.
   - Write integration tests for `AuthController` verifying refresh token behavior and session revocation.
2. **Phase 2 (P1):**
   - Add schema validation unit tests in `packages/contracts`.
   - Implement E2E authentication smoke tests with Playwright for Next.js web application.
3. **Phase 3 (P2):**
   - Add controller-level integration tests using Supertest and Testcontainers.
