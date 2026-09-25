# SAAR Production Rollback Runbook

## 1. Rollback Criteria
A rollback must be initiated immediately if any of the following occur post-deployment:
- API 5xx error rate exceeds 1% for more than 3 minutes.
- Readiness check fails across more than 25% of container replicas.
- Auth regression detected (users unable to login or refresh sessions).
- Data integrity issue or critical database contention observed.

## 2. Immediate Container Rollback
Because SAAR container images are immutably tagged with Git commit SHAs, rolling back the application code takes < 60 seconds:

### Via Kubernetes / Helm:
```bash
# Check deployment rollout history
kubectl rollout history deployment/saar-api -n production

# Undo to immediately previous revision
kubectl rollout undo deployment/saar-api -n production

# Verify status
kubectl rollout status deployment/saar-api -n production
```

### Via Docker Compose / ECS:
```bash
# Update task definition / compose to target previous image tag
export IMAGE_TAG=<previous-stable-sha>
docker compose -f infra/docker/docker-compose.prod.yml up -d --no-deps api
```

## 3. Database Migration Rollback Strategy
SAAR enforces the **Expand/Contract Pattern** for database schema evolution:
1. **Never drop columns immediately**: The new version writes to new columns while reading from old or synchronized columns.
2. **Backwards-Compatible Schema**: A previous application version can always run safely against a newer migrated schema.
3. **Emergency Schema Rollback**:
   If a migration introduced locking or severe index bloat:
   ```bash
   # Inspect migration history
   pnpm prisma migrate status
   
   # Execute down migration script prepared in migration bundle
   # Example: DROP INDEX CONCURRENTLY IF EXISTS ...
   ```
