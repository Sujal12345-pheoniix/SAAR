# SAAR Infrastructure & Deployment Audit

**Author:** Principal DevOps & Infrastructure Architect  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Containerization, Local Infrastructure, Cloud Architecture, Secrets Management, Disaster Recovery  

---

## 1. Executive Summary

The infrastructure of SAAR currently relies on local Docker Compose for auxiliary development dependencies (PostgreSQL 16, Redis 7) and cloud-managed services (Neon Serverless Postgres) for remote testing.

The forensic audit revealed that **production containerization is completely non-existent**:
- There are **no Dockerfiles** for `apps/api`, `apps/web`, or `apps/mobile`.
- There are **no Infrastructure as Code (IaC)** templates (Terraform, Pulumi, AWS CDK, or Kubernetes manifests).
- Deployment runbooks are manual, untracked, and prone to configuration drift.

---

## 2. Containerization Analysis

### 2.1 Local Docker Compose (`infra/docker/docker-compose.yml`)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: saar-postgres
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: saardb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - saar_network

  redis:
    image: redis:7-alpine
    container_name: saar-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    networks:
      - saar_network
```
- **Strengths:** Lightweight Alpine images, persistent named volumes for local state.
- **Defects:**
  1. Default root passwords (`postgrespassword`) committed to source control.
  2. Missing healthcheck stanzas (`pg_isready`, `redis-cli ping`) causing race conditions when services spin up concurrently.

### 2.2 Missing Production Application Dockerfiles (`P1-INFRA-001`)
- **Severity:** P1 — HIGH
- Neither `apps/api` nor `apps/web` contains a `Dockerfile`.
- **Consequence:**
  - Production deployments cannot be standardized on container orchestration platforms (AWS ECS, Google Cloud Run, Kubernetes).
  - Runtime environment depends entirely on host system Node.js and OS dependencies, leading to "works on my machine" failures in production.
  - Absence of multi-stage caching results in bloated build times and insecure production images containing development toolchains (`typescript`, `eslint`, `jest`).

---

## 3. Cloud Architecture & Hosting Strategy

| Component | Target Hosting Platform | Current Readiness Status | Identified Risks |
|---|---|---|---|
| **Web Client (`apps/web`)** | Vercel | Semi-Ready (Next.js 14 App Router) | Client-side cookie setting issues (`P1-SEC-001`), CORS wildcarding (`P2-SEC-001`). |
| **API Server (`apps/api`)** | Undefined (Render / Railway / AWS) | **Unready** | No Dockerfile, missing production process manager (PM2/Docker), unmanaged clustering. |
| **Database** | Neon Serverless PostgreSQL | Ready (Schema deployed) | Pooler prepared statement caching conflict, connection exhaustion during bursts. |
| **Cache / Queue** | Redis (Local only) | **Unready** | Upstash/ElastiCache not provisioned; NestJS lacks Redis connection pooling in app. |
| **Mobile Client** | Expo EAS / App Stores | Semi-Ready | Broken auth endpoints causing 100% crash on launch (`P0-MOB-001`). |

---

## 4. Secrets Management & Environment Configuration

### 4.1 Root `.env.example` vs Runtime Validation
The environment schema is validated at API bootstrap via Joi in `apps/api/src/config/env.validation.ts`:
- **Discrepancy:** The root `.env.example` contains placeholders that diverge from CI environment variables (`JWT_SECRET` in CI vs `JWT_ACCESS_SECRET` in API validation).
- **Hardcoded Secret Hazards:** Default fallback secrets in code (`saar_secret_key_change_me`) allow unauthorized JWT forgery if environment loading fails silently.

---

## 5. Remediation Roadmap

1. **Create Production Multi-Stage Dockerfiles:**
   - Write `apps/api/Dockerfile` with non-root user execution (`USER node`), multi-stage builder, and minimal Alpine runtime.
   - Write `apps/web/Dockerfile` with Next.js standalone output mode.
2. **Add Container Healthchecks:**
   - Update `docker-compose.yml` with native `pg_isready` and `redis-cli ping` checks.
3. **Provision Cloud Cache & Queue:**
   - Provision managed Redis instance (Upstash or AWS ElastiCache) and bind to API BullMQ workers.
4. **Standardize CI Environment:**
   - Sync `.env.example`, `.github/workflows/ci.yml`, and `env.validation.ts`.
