# SAAR Database Migration Policy & Operations Guide (Part 2A)

## 1. Core Principles
1. **Versioned Migrations Only**: Every schema mutation must be expressed as a numbered, reviewed SQL migration script in `prisma/migrations/`.
2. **Strictly Prohibited**: Running `prisma db push` in production, staging, or CI pipelines is strictly forbidden.
3. **Zero Data Loss Guarantee**: No column drops, table drops, or destructive type changes are permitted in the same deployment that depends on them.

---

## 2. The Expand / Contract Migration Pattern
To guarantee zero-downtime rolling deployments, all schema modifications follow the **Expand/Contract Pattern**:

```
Phase 1 (Expand):
  - Add new nullable column or column with default value (e.g. `Task.rescheduledAt`).
  - Deploy migration before application code.
  - Old application pods safely ignore the new column.

Phase 2 (Migrate Data & Code):
  - Deploy new application code that writes to the new column.
  - Run backfill script if historical migration is required.

Phase 3 (Contract — Next Sprint):
  - Add NOT NULL constraint (if applicable).
  - Remove deprecated code paths.
```

---

## 3. Migration Creation & Testing Lifecycle

### Step 1: Create Schema Change
Edit `prisma/schema.prisma`.

### Step 2: Generate Migration
```bash
# Create named migration script
pnpm prisma migrate dev --name <descriptive_slug>
```

### Step 3: Inspect Generated SQL
Review the created `migration.sql`:
- Are all `ALTER TABLE` statements non-blocking?
- Are new indexes added with `IF NOT EXISTS`?
- Are foreign keys configured with explicit `ON DELETE` rules?

### Step 4: Verify in CI
The CI workflow in `.github/workflows/ci.yml` spins up a clean PostgreSQL 16 container and runs:
```bash
pnpm db:migrate
pnpm db:seed
pnpm test:integration
```
Any schema mismatch, missing constraint, or migration ordering flaw will fail the CI gate immediately.

---

## 4. Production Deployment Protocol
- Production migrations run via:
  ```bash
  prisma migrate deploy --schema=prisma/schema.prisma
  ```
- Executed as an isolated pre-deploy container step in GitHub Actions (`deploy-production.yml`) before new application containers begin accepting live traffic.
