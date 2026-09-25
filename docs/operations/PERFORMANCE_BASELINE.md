# SAAR Performance Baseline & Benchmarks

## 1. Environment Specifications
- **Node.js**: v24.x LTS
- **Prisma Client**: v5.20.0
- **PostgreSQL**: 16-alpine with pgBouncer connection pooling
- **Redis**: 7-alpine (in-memory caching & rate limiting)

## 2. API Endpoint Latency Targets & Baselines

| Route | Method | Target P50 | Target P95 | Target P99 | Throughput (RPS) |
|-------|--------|------------|------------|------------|------------------|
| `/api/v1/health` | GET | < 2 ms | < 5 ms | < 10 ms | 2,000+ |
| `/api/v1/ready` | GET | < 15 ms | < 35 ms | < 70 ms | 500+ |
| `/api/v1/auth/login` | POST | 180 ms (Argon2id) | 260 ms | 350 ms | 100 |
| `/api/v1/auth/refresh` | POST | 85 ms | 140 ms | 220 ms | 300 |
| `/api/v1/life-areas` | GET | < 18 ms | < 45 ms | < 90 ms | 1,000+ |
| `/api/v1/goals` | GET | < 25 ms | < 60 ms | < 120 ms | 800+ |
| `/api/v1/tasks` | GET | < 22 ms | < 55 ms | < 110 ms | 800+ |

## 3. Database Query Baselines
- All user-facing read queries (`findAll`, `findOne`) leverage indexed fields (`userId`, `status`, `targetDate`).
- Maximum query execution time: < 20 ms.
- Zero sequential scans on core tables (`User`, `Session`, `Goal`, `Task`, `LifeArea`).

## 4. Resource Allocation
- **API Pods**: 0.5 vCPU request, 1.0 vCPU limit, 512MB RAM request, 1024MB RAM limit.
- **Node Max Heap**: `--max-old-space-size=768`
