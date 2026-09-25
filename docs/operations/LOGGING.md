# SAAR Logging Architecture & Security Policy

## 1. Principles
- **Machine-Readable**: All log entries in production are structured JSON emitted via `pino`.
- **Zero Information Leakage**: Credentials, refresh tokens, session hashes, authorization tokens, passwords, and sensitive PII are stripped.
- **Uniform Context**: Every log record contains standard correlation fields.

## 2. Standard Log Record Format
```json
{
  "level": 30,
  "time": 1790332800000,
  "pid": 1,
  "hostname": "saar-api-6b7d7b4c9-xk28m",
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "method": "POST",
  "url": "/api/v1/auth/refresh",
  "statusCode": 200,
  "durationMs": 42.5,
  "userId": "usr_981a8b2c",
  "msg": "HTTP request completed"
}
```

## 3. Log Levels & Usage

| Level | Severity | When to Use | Destination |
|-------|----------|-------------|-------------|
| `fatal` | 60 | Unrecoverable crash, process exiting | Alerting + PagerDuty |
| `error` | 50 | Unhandled exceptions, failed DB queries, 5xx errors | Error tracking (Sentry) |
| `warn` | 40 | Degraded states, token reuse detections, rate limits hit | Observability log stream |
| `info` | 30 | Standard request lifecycle, service boot, migration run | Standard log aggregator |
| `debug` | 20 | Verbose debugging (disabled in production) | Local/Staging only |

## 4. Redaction Directives
In `apps/api/src/common/interceptors/logging.interceptor.ts`, the following keys are automatically redacted:
- `password`
- `newPassword`
- `confirmPassword`
- `refreshToken`
- `authorization`
- `token`
- `secret`
