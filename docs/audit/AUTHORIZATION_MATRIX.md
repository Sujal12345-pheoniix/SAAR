# SAAR Complete Authorization Matrix

**Author:** Principal Security Engineer & Forensic Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  

This authorization matrix documents all API endpoints discovered across the NestJS API application (`apps/api/src/modules/`), auditing authentication guards, tenant data ownership enforcement, role restrictions, and existing test coverage.

---

## Complete API Endpoint Authorization Matrix

| Endpoint | Method | Guard / Auth Required | Tenant Ownership Enforced | Role Required | Vulnerability / Risk Level | Existing Test Coverage |
|---|---|---|---|---|---|---|
| `/auth/register` | `POST` | None (Public) | N/A (New user registration) | None | Medium (Rate limit inactive P0-SEC-002) | Unit test (mocked) |
| `/auth/login` | `POST` | None (Public) | N/A (Credentials verified) | None | High (Rate limit inactive P0-SEC-002) | Unit test (mocked) |
| `/auth/refresh` | `POST` | None (Public) | Verified via hash loop | None | **P0 Critical** (O(N) CPU DoS P0-AUTH-001) | Unit test (mocked) |
| `/auth/logout` | `POST` | `JwtAuthGuard` | Enforced (`req.user.sessionId`) | Any | Medium (Token not revoked in memory P1-AUTH-001) | Unit test (mocked) |
| `/auth/logout-all` | `POST` | `JwtAuthGuard` | Enforced (`req.user.id`) | Any | Medium (Existing access tokens still valid) | Unit test (mocked) |
| `/api/v1/users/me` | `GET` | `JwtAuthGuard` | Enforced (`where: { id: req.user.id }`) | Any | Low | Unit test (mocked) |
| `/api/v1/users/me` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { id: req.user.id }`) | Any | Low | Unit test (mocked) |
| `/api/v1/users/profile` | `GET` | `JwtAuthGuard` | Enforced (`where: { userId: req.user.id }`) | Any | Low | Unit test (mocked) |
| `/api/v1/users/profile` | `PUT` | `JwtAuthGuard` | Enforced (`where: { userId: req.user.id }`) | Any | Low | Unit test (mocked) |
| `/api/v1/future-self` | `GET` | `JwtAuthGuard` | Enforced (`where: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/future-self` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/future-self` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/future-self/dimensions` | `POST` | `JwtAuthGuard` | Validated via parent futureSelf | Any | Low | Unit test (mocked) |
| `/api/v1/future-self/dimensions/:id` | `PATCH` | `JwtAuthGuard` | Validated via parent futureSelf | Any | Low | Unit test (mocked) |
| `/api/v1/future-self/dimensions/:id` | `DELETE` | `JwtAuthGuard` | Validated via parent futureSelf | Any | Low | Unit test (mocked) |
| `/api/v1/life-areas` | `GET` | `JwtAuthGuard` | Enforced (`where: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/life-areas` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/life-areas/:id` | `GET` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/life-areas/:id` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/life-areas/:id` | `DELETE` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/life-areas/seed` | `POST` | `JwtAuthGuard` | Injected (`userId`) | Any | Low | Unit test (mocked) |
| `/api/v1/goals` | `GET` | `JwtAuthGuard` | Enforced (`where: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/goals` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/goals/:id` | `GET` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/goals/:id` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/goals/:id` | `DELETE` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/goals/:id/milestones` | `POST` | `JwtAuthGuard` | Verifies parent goal ownership | Any | Low | Unit test (mocked) |
| `/api/v1/goals/:goalId/milestones/:id` | `PATCH` | `JwtAuthGuard` | **IDOR Vulnerability** (Parent goal userId not verified) | Any | **High** | Untested |
| `/api/v1/goals/:goalId/milestones/:id` | `DELETE` | `JwtAuthGuard` | **IDOR Vulnerability** (Direct id deletion) | Any | **High** | Untested |
| `/api/v1/tasks` | `GET` | `JwtAuthGuard` | Enforced (`where: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/tasks` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/tasks/:id` | `GET` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/tasks/:id` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/tasks/:id` | `DELETE` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/tasks/:id/status` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/tasks/:id/subtasks` | `POST` | `JwtAuthGuard` | Verifies parent task ownership | Any | Low | Unit test (mocked) |
| `/api/v1/tasks/:taskId/subtasks/:id` | `PATCH` | `JwtAuthGuard` | **IDOR Vulnerability** (Only subtaskId checked) | Any | **High** | Untested |
| `/api/v1/tasks/:taskId/subtasks/:id` | `DELETE` | `JwtAuthGuard` | **IDOR Vulnerability** (Direct subtaskId deletion) | Any | **High** | Untested |
| `/api/v1/routines` | `GET` | `JwtAuthGuard` | Enforced (`where: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/routines` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/routines/:id` | `GET` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/routines/:id` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/routines/:id` | `DELETE` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/routines/:id/complete` | `POST` | `JwtAuthGuard` | Enforced (Checks routine ownership) | Any | Low | Unit test (mocked) |
| `/api/v1/daily-growth` | `GET` | `JwtAuthGuard` | Enforced (`where: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/daily-growth` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/daily-growth/:id` | `GET` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/daily-growth/:id` | `PATCH` | `JwtAuthGuard` | Enforced (`where: { id, userId }`) | Any | Low | Unit test (mocked) |
| `/api/v1/behavior-events` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Medium (Outbox accumulation) | Unit test (mocked) |
| `/api/v1/behavior-events/batch` | `POST` | `JwtAuthGuard` | Injected (`data: { userId }`) | Any | Medium (Outbox accumulation) | Untested |
| `/api/v1/health` | `GET` | None (Public) | N/A | None | Low | Integration test (mocked) |

---

## Summary of Authorization Gaps
1. **Total Public Endpoints:** 4 (`/auth/register`, `/auth/login`, `/auth/refresh`, `/api/v1/health`).
2. **Total Guarded Endpoints:** 47.
3. **IDOR High-Risk Endpoints:** 4 (Nested subtasks and milestones).
4. **Integration Test Gap:** 0 endpoints tested against a live database with role enforcement.
