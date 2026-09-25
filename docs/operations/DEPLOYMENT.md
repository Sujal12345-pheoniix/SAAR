# SAAR Production Deployment Runbook

## 1. Overview
SAAR production deployments follow automated, reproducible CI/CD pipelines managed via GitHub Actions with strict quality and security gates.

## 2. Pre-Deployment Verification Checklist
Before initiating or approving a deployment to staging or production:
- [ ] All CI checks pass:
  - `pnpm lint` (zero warnings/errors)
  - `pnpm typecheck` (zero TypeScript errors)
  - `pnpm test` (all unit and multi-tenant test suites pass)
  - Secret scan via TruffleHog (zero unencrypted secrets)
- [ ] Database migrations are backwards-compatible:
  - No column drops in the same deploy that writes to them.
  - New required columns have default values.
  - Indexes added concurrently where supported.
- [ ] Docker container build succeeds cleanly with non-root user.

## 3. Deployment Pipeline Sequence

```
1. PR merged into `main`
             │
             ▼
2. Trigger `.github/workflows/deploy-staging.yml`
   - Build container image tagged with `sha-<short-sha>`
   - Push to container registry
   - Run `prisma migrate deploy` against Staging database
   - Update Staging deployment manifest
   - Run smoke tests against `https://staging-api.saar.dev/api/v1/ready`
             │
             ▼
3. Manual Approval Gate for Production
             │
             ▼
4. Trigger `.github/workflows/deploy-production.yml`
   - Run pre-deploy migration: `prisma migrate deploy`
   - Rolling update / Canary rollout (25% -> 50% -> 100%)
   - Healthcheck verification (`GET /api/v1/health` and `/ready`)
   - Monitor error rate metrics for 15 minutes
```

## 4. Environment Variables Configuration
Ensure all required production secrets are configured in the cloud secret manager (AWS Secrets Manager / Vault / Vercel Environment Variables):
- `DATABASE_URL` (Neon Postgres pooler URL with SSL enabled)
- `REDIS_URL` (Upstash / Redis cluster URL)
- `JWT_ACCESS_SECRET` (Minimum 32 random bytes)
- `JWT_REFRESH_SECRET` (Minimum 32 random bytes)
- `CORS_ALLOWED_ORIGINS` (Comma-separated production domains)
- `NODE_ENV=production`
