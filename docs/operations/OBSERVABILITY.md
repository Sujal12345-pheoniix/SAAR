# SAAR Observability Architecture & Standards

## 1. Pillars of Observability
SAAR provides complete telemetry across Logs, Metrics, and Traces to guarantee system transparency in production.

### 1.1 Logs (Pino)
- Standard: Structured JSON output to stdout.
- Traceability: Every request logs `requestId`, `method`, `url`, `statusCode`, `durationMs`, and authenticated `userId` (when available).
- Redaction: Authorization headers, JWTs, Argon2 hashes, passwords, and PII are redacted prior to logging.

### 1.2 Distributed Tracing (OpenTelemetry / W3C Trace Context)
- Every incoming request generates or propagates `traceparent` and `X-Request-Id`.
- Propagated across HTTP hops and background worker jobs to enable end-to-end trace stitching.

### 1.3 Metrics & Dashboards (Prometheus / Grafana)
Key Service Level Indicators (SLIs) tracked:
- **HTTP Request Rate & Status Codes**: `http_requests_total{status=~"2..|4..|5.."}`
- **Latency (P50, P95, P99)**: `http_request_duration_seconds_bucket`
- **Database Connection Pool**: `prisma_pool_active_connections`, `prisma_pool_wait_duration_ms`
- **Redis Status**: `redis_connected_clients`, `redis_memory_used_bytes`
- **Rate Limit Hits**: `throttle_limit_exceeded_total`

## 2. Core Service Level Objectives (SLOs)
- **API Availability**: >= 99.9% success rate (non-5xx responses) over 30 days.
- **Latency (P95)**: < 250ms for read endpoints; < 400ms for write mutations (including password hashing).
- **Session Revocation Latency**: < 50ms propagation across all cluster nodes.

## 3. Alerting Rules
- **Critical (P1)**: 5xx error rate > 2% for 5 consecutive minutes → PagerDuty trigger.
- **Critical (P1)**: Database health check `GET /ready` returns degraded for 2 consecutive probes.
- **Warning (P2)**: P95 latency > 800ms for 10 minutes.
- **Warning (P2)**: Redis memory utilization > 80%.
