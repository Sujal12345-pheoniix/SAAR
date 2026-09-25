# SAAR Health & Readiness Probes Specification

## 1. Endpoints Overview

| Endpoint | Purpose | Target Audience | Cache Header |
|----------|---------|-----------------|--------------|
| `GET /api/v1/health` | Liveness probe (Process alive) | Kubernetes / Docker / AWS ECS | `no-cache` |
| `GET /api/v1/ready` | Readiness probe (Dependencies reachable) | Load Balancer / Ingress Router | `no-cache` |
| `GET /api/v1/meta` | Build & Environment metadata | CI/CD / Deployment verifier | `no-cache` |

## 2. Endpoint Specifications

### 2.1 Liveness Probe: `GET /api/v1/health`
- **Purpose**: Verify that the Node.js event loop is not blocked and NestJS process is responsive.
- **Dependencies checked**: None (pure in-memory).
- **HTTP Response Codes**:
  - `200 OK`: Process is healthy.
- **Response Payload**:
```json
{
  "status": "ok",
  "timestamp": "2026-09-25T15:45:00.000Z",
  "version": "0.1.0"
}
```

### 2.2 Readiness Probe: `GET /api/v1/ready`
- **Purpose**: Determine if the instance can safely accept external customer traffic.
- **Dependencies checked**:
  - PostgreSQL Database: executes `SELECT 1` via Prisma.
  - Redis: executes `PING` returning `PONG`.
- **HTTP Response Codes**:
  - `200 OK`: All dependency checks pass (`status: "ready"`).
  - `503 Service Unavailable`: One or more dependencies failed (`status: "degraded"`).
- **Response Payload**:
```json
{
  "status": "ready",
  "timestamp": "2026-09-25T15:45:00.000Z",
  "checks": {
    "database": true,
    "redis": true
  }
}
```

### 2.3 Metadata Endpoint: `GET /api/v1/meta`
- **Purpose**: Quick inspection of current commit, environment, and timestamp during canary releases.
```json
{
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2026-09-25T15:45:00.000Z"
}
```

## 3. Orchestration Configuration
In Kubernetes manifests or ECS task definitions:
```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/v1/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```
