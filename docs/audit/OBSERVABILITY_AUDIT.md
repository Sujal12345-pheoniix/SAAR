# SAAR Observability, Monitoring & Telemetry Audit

**Author:** Principal Reliability Engineer & Systems Architect  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Structured Logging, APM Metrics, Distributed Tracing, Error Alerting, Health Probes  

---

## 1. Executive Summary

Observability across the SAAR platform was forensically assessed across the three pillars of telemetry: **Logs, Metrics, and Traces**, in addition to health probe readiness and alerting infrastructure.

The current implementation provides a solid baseline for **request-level structured logging** via Pino and correlation IDs (`X-Request-Id`). However, **metrics collection and distributed tracing are completely absent, error tracking services (Sentry) are unintegrated, and health probes do not monitor the Redis cache**.

---

## 2. Telemetry Pillar Forensic Analysis

### 2.1 Logging Pillar
- **Framework:** `pino` v9.4 and `pino-pretty` v11.2.
- **Request ID Tracking (`request-id.interceptor.ts`):**
  - Captures incoming `X-Request-Id` or generates a UUID v4.
  - Sets header on outgoing HTTP responses.
- **Logging Interceptor (`logging.interceptor.ts`):**
  - Logs HTTP method, URL, status code, latency, and request ID.
  - Redacts sensitive headers (`authorization`, `cookie`) and body fields (`password`, `refreshToken`).
- **Gaps:**
  1. Authenticated user ID (`req.user.id`) is not consistently attached to log metadata, hindering per-user forensic investigation.
  2. No centralized log shipper (Datadog, Grafana Loki, CloudWatch) configured for production.

### 2.2 Metrics Pillar (Absent)
- **Status:** **0% Implemented**.
- Neither `@willsoto/nestjs-prometheus` nor `@opentelemetry/sdk-metrics` is installed.
- There is **no `/metrics` endpoint** to expose Golden Signals (Latency, Traffic, Errors, Saturation).
- No metrics track Prisma active database connections, query latencies, cache hit/miss ratios, or event loop lag.

### 2.3 Distributed Tracing Pillar (Absent)
- **Status:** **0% Implemented**.
- No OpenTelemetry instrumentation exists.
- In multi-tier user journeys (Web Client -> Next.js SSR -> NestJS API -> Prisma -> Postgres), there is no distributed trace context propagation (W3C `traceparent` headers).

---

## 3. Error Tracking & Crash Reporting

- **Status:** **Unconfigured**.
- Neither `@sentry/node`, `@sentry/nextjs`, nor `@sentry/react-native` is installed.
- When unhandled 500 exceptions occur in `http-exception.filter.ts`, the stack trace is logged to stdout, but **no real-time alerts or error capture notifications are dispatched to developers**.
- Production crashes will go unnoticed until reported by end users.

---

## 4. Health Checks & Readiness Probes (`HealthModule`)

### 4.1 Endpoint Review (`GET /api/v1/health`)
- **File:** `apps/api/src/modules/health/health.controller.ts`
- Uses `@nestjs/terminus` v10.2:
  ```typescript
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }
  ```
- **Strengths:** Accurately tests PostgreSQL connectivity via `SELECT 1` and guards against Node.js memory leaks with a 300MB heap ceiling.
- **Defects:**
  1. **Missing Redis Health Indicator:** Does not ping Redis. If Redis crashes or exhausts connections, the API reports healthy.
  2. **No Readiness vs Liveness Differentiation:** Kubernetes / cloud orchestrators require separate `/health/live` and `/health/ready` endpoints to prevent premature traffic routing during cold boots.

---

## 5. Remediation Roadmap

1. **Integrate Prometheus Metrics:**
   Install `@willsoto/nestjs-prometheus` and expose standard HTTP request and Prisma connection pool metrics at `/metrics`.
2. **Install Sentry Error Tracking:**
   Install `@sentry/node` in `apps/api` and `@sentry/nextjs` in `apps/web`.
3. **Add Redis Health Check:**
   Add a Redis ping indicator to `health.controller.ts`.
4. **Enrich Log Context:**
   Inject `userId` into the logging interceptor payload for authenticated requests.
