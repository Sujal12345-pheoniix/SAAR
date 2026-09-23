# ADR-009: Observability & Incident Response

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead                          |

---

## Context

SAAR is an always-on personal coaching platform. Users depend on it for daily check-ins,
goal tracking, and AI coaching. Incidents — whether a crashed API, a runaway AI cost,
or a stalled queue — must be detectable and diagnosable without SSH access to production
machines.

The observability strategy must balance:

1. **Signal richness**: enough data to debug production issues.
2. **Cost control**: log volume and trace storage must be bounded.
3. **Privacy**: logs must not contain PII, user messages, or AI completions.
4. **Developer experience**: local dev should work without a full observability stack.

### The Three Pillars

| Pillar       | Tool                                | Purpose                                    |
|--------------|-------------------------------------|--------------------------------------------|
| **Logs**     | Pino (structured JSON)              | Event timeline, error context              |
| **Traces**   | OpenTelemetry → Jaeger/Tempo        | Request path, latency breakdown            |
| **Metrics**  | OTEL Metrics → Prometheus/Grafana   | SLIs, SLOs, dashboards, alerts             |

---

## Decision

**Structured JSON logs with correlation IDs. OpenTelemetry for distributed traces.
OTEL metrics for dashboards and alerting. Alert on 5xx spikes, queue depth, AI latency,
and SLO breaches. PII must be redacted before any log or trace is emitted.**

### Logging

#### Format

All log lines are structured JSON emitted by **Pino**:

```json
{
  "level": "info",
  "time": "2026-09-23T07:45:00.000Z",
  "pid": 1,
  "hostname": "saar-api-7d4b9f",
  "requestId": "req_01j8kx9m2t3v4w5x6y7z",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "userId": "usr_01j8kx9m2t",
  "feature": "tasks",
  "msg": "Task completed",
  "taskId": "task_01j8ky...",
  "durationMs": 42
}
```

#### Log Levels by Environment

| Environment | Minimum Level | Output            |
|-------------|---------------|-------------------|
| development | debug         | Pretty-printed    |
| test        | warn          | Suppress noise    |
| staging     | info          | JSON → stdout     |
| production  | info          | JSON → stdout     |

#### PII Redaction Rules

The following fields are **never** logged:

| Field Category          | Example                       | Redaction Strategy          |
|-------------------------|-------------------------------|-----------------------------|
| Email addresses         | `user@example.com`            | `[REDACTED_EMAIL]`          |
| IP addresses (full)     | `192.168.1.42`                | Log only first 2 octets     |
| Auth tokens             | Bearer `eyJ…`                 | Never log                   |
| Passwords               | `SaarDemo#2027!`              | Never log                   |
| AI prompt content       | User message text             | Never log (use `[PROMPT]`)  |
| AI completion content   | Model response text           | Never log                   |
| Personal names          | In memory facts               | Never log                   |
| Phone numbers           | `+91-98765-43210`             | `[REDACTED_PHONE]`          |

A Pino `redact` configuration enforces these rules at the logger level.

### Distributed Tracing

**OpenTelemetry** (OTEL) SDK is initialized in `main.ts` before NestJS bootstraps.

Trace context propagates via `traceparent` / `tracestate` headers (W3C Trace Context).

Spans are automatically created for:
- HTTP requests (`@opentelemetry/instrumentation-http`)
- NestJS route handlers (`@opentelemetry/instrumentation-nestjs-core`)
- Prisma queries (`prisma-otel-tracing`)
- BullMQ job execution (manual span)

AI calls get custom spans with:
- `ai.feature` attribute (e.g., `insight_gen`)
- `ai.model` attribute
- `ai.input_tokens` and `ai.output_tokens`
- Duration (latency)
- **No prompt or completion content**

### Metrics & Alerts

#### Key Metrics

| Metric Name                         | Type      | SLO / Alert Threshold          |
|-------------------------------------|-----------|--------------------------------|
| `http_request_duration_ms`          | Histogram | p99 < 500 ms                   |
| `http_requests_total{status="5xx"}` | Counter   | Alert: > 1% of requests        |
| `ai_request_duration_ms`            | Histogram | Alert: p95 > 10,000 ms         |
| `ai_tokens_used_total`              | Counter   | Alert: > 90% daily budget      |
| `queue_depth{queue="outbox"}`       | Gauge     | Alert: > 500 pending            |
| `queue_depth{queue="ai_jobs"}`      | Gauge     | Alert: > 100 pending           |
| `db_pool_wait_ms`                   | Histogram | Alert: p95 > 1,000 ms          |
| `auth_failures_total`               | Counter   | Alert: > 50/min per IP          |
| `subscription_webhook_errors_total` | Counter   | Alert: > 5 in 5 min            |

#### SLOs

| SLO                                   | Target   |
|---------------------------------------|----------|
| API availability (5xx rate)           | 99.5%    |
| AI coaching latency p95               | ≤ 10 s   |
| Check-in save latency p99             | ≤ 300 ms |
| Authentication latency p99            | ≤ 500 ms |
| Outbox delivery within 30 seconds     | 99%      |

#### Alert Routing

Phase 1 alerts route to a Slack `#saar-alerts` webhook. On-call rotation not required
for solo team — alerts go to engineering lead's mobile (PagerDuty or Opsgenie free tier).

### Health Endpoints

```
GET /health     → Liveness (always 200 if process is alive)
GET /ready      → Readiness (checks DB, Redis connectivity)
```

Readiness check fails → container removed from load balancer rotation.

### Local Development

Local dev does **not** require a full observability stack. Pino outputs pretty-printed
logs to stdout. OTEL can be disabled via `OTEL_EXPORTER_OTLP_ENDPOINT=` (empty).
Metrics are exposed at `GET /metrics` (Prometheus text format) for manual inspection.

---

## Consequences

### Positive
- Incidents diagnosable from logs + traces without SSH.
- AI cost anomalies caught before budget overrun.
- SLO tracking enables data-driven reliability conversation.
- Privacy: PII redaction at logger level is a last-resort safety net.

### Negative / Risks
- **Log volume** at scale. **Mitigation**: info-level by default, debug only in
  staging; log sampling for high-frequency paths (health check polls).
- **OTEL setup complexity** at startup. **Mitigation**: wrapped in `TelemetryModule`
  with sensible defaults; OTEL disabled in unit tests.
- **Trace storage cost**. **Mitigation**: sample 100% in staging, 10% in production
  (configurable via `OTEL_TRACES_SAMPLER_ARG`).

---

## References

- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Pino Logger](https://getpino.io/)
- [Google SRE Book — SLOs](https://sre.google/sre-book/service-level-objectives/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
