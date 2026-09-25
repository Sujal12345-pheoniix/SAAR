# SAAR Dependency & Supply Chain Audit

**Author:** Principal Software Architect & Security Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Monorepo Workspace Dependencies, Lockfile Health, Vulnerability Profile, Version Drift, Supply Chain Risks  

---

## 1. Executive Summary

SAAR manages third-party dependencies through a single centralized `pnpm-lock.yaml` across 3 applications (`apps/api`, `apps/web`, `apps/mobile`) and 6 shared packages (`packages/contracts`, `domain`, `ai-core`, `analytics`, `config`, `ui`).

The forensic dependency audit concluded that while core runtime dependencies are reasonably modern (NestJS 10, Next.js 14, Expo 51, Prisma 5), **the codebase exhibits critical missing runtime libraries, developer tooling version mismatches, and supply chain exposure**.

---

## 2. Dependency Inventory & Version Matrix

| Ecosystem / Layer | Core Dependency | Monorepo Version | Latest Stable | Health / Audit Assessment |
|---|---|---|---|---|
| **Runtime Framework** | NestJS | `^10.4.4` | `10.4.5` | Stable, modern, active LTS. |
| **Frontend Framework** | Next.js | `14.2.13` | `14.2.15` | App Router, React 18.3.1. Stable. |
| **Mobile Runtime** | Expo SDK / React Native | `51.0.28` / `0.74.5` | `51.0.38` / `0.75+` | Expo SDK 51 modern; compatible with React 18. |
| **ORM / Data Layer** | Prisma Client / CLI | `^5.20.0` / `^5.20.0` | `5.22.0` | Active version; compatible with Neon Postgres. |
| **Cryptography** | Argon2 | `^0.41.1` | `0.41.1` | Native C++ bindings; secure implementation. |
| **Security Headers** | Helmet | `^8.0.0` | `8.0.0` | Modern security headers library. |
| **Validation** | Joi & Class-Validator | `^17.13.3` / `^0.14.1` | Current | Functional; duplicated with Zod contracts. |
| **Monorepo Build** | Turborepo | `^2.1.2` | `2.1.2` | Turbo 2 engine; fast pipeline caching. |
| **Linter / Formatter** | ESLint / Prettier | `^8.57.1` / `^3.3.3` | `9.11.0` / `3.3.3` | ESLint 8 is approaching end-of-life; migration required. |

---

## 3. Critical Missing Dependencies

### 3.1 Missing Redis Client in Backend API (`P1-DEP-001`)
- **Inspection:** `infra/docker/docker-compose.yml` spins up a Redis 7 instance, and `.env.example` defines `REDIS_URL`.
- **Finding:** In `apps/api/package.json`, **neither `ioredis`, `redis`, nor `@nestjs-modules/ioredis` is installed**.
- **Impact:** The NestJS API has no driver to connect to Redis. All Redis caching, session blacklisting, and throttling features configured in environment variables are impossible to execute.

### 3.2 Missing Asynchronous Job Queue (`P1-DEP-002`)
- **Inspection:** The outbox pattern in `behavior-events.service.ts` writes pending events to PostgreSQL.
- **Finding:** Neither `bullmq`, `@nestjs/bullmq`, nor any background queue library is declared in dependencies.
- **Impact:** The application cannot process asynchronous background tasks.

### 3.3 Missing OpenAPI Tooling (`P2-DEP-001`)
- **Finding:** Neither `@nestjs/swagger` nor `swagger-ui-express` is installed.
- **Impact:** No automated API contract generation or interactive documentation is possible.

---

## 4. Supply Chain & Lockfile Integrity

- **Lockfile Format:** `pnpm-lock.yaml` v9 (pnpm 9/10/12 compatible).
- **Frozen Lockfile Enforcement:** CI runs `pnpm install --frozen-lockfile`, preventing unverified dependency drift.
- **Package Hoisting:** Workspace packages properly reference local sibling packages using `workspace:*` protocols.

---

## 5. Remediation Plan

1. Install `ioredis` and `bullmq` in `apps/api` to enable Redis operations and background task processing.
2. Install `@nestjs/swagger` and `swagger-ui-express` in `apps/api`.
3. Plan migration path from ESLint 8 to ESLint 9 Flat Config.
