# Runbook: Database Migrations

> **Audience**: Engineers working on schema changes or diagnosing migration issues.  
> **Tools**: Prisma Migrate, PostgreSQL 16.

---

## Overview

SAAR uses **Prisma Migrate** for schema version control. Every schema change:

1. Is written in `prisma/schema.prisma` (the source of truth)
2. Generates a SQL migration file in `prisma/migrations/`
3. Is committed to git alongside the code that depends on the new schema
4. Is applied to each environment via CI/CD (staging auto, production manual)

All migrations must be **backward-compatible** (see Migration Rules below).

---

## Common Migration Commands

### Check migration status

```bash
pnpm exec prisma migrate status
```

Shows: which migrations are applied, which are pending, and whether the DB schema
matches the schema file.

### Apply pending migrations (non-destructive, any environment)

```bash
pnpm db:migrate
# Runs: prisma migrate deploy
```

`migrate deploy` applies only new migrations. It never resets or drops data.
Safe to run in staging and production.

### Create a new migration (dev only)

```bash
pnpm db:migrate:dev --name <description>
# Example:
pnpm db:migrate:dev --name add_tasks_completed_note
```

This will:
1. Diff `prisma/schema.prisma` against the current DB
2. Generate `prisma/migrations/TIMESTAMP_add_tasks_completed_note/migration.sql`
3. Apply the migration to your local dev DB
4. Regenerate the Prisma client

> ⚠️ `migrate dev` is for **local development only**. Never run it in staging or production.

### Reset the database (dev only — DESTRUCTIVE)

```bash
pnpm db:reset
# Runs: prisma migrate reset
```

**Warning**: This drops all data, re-runs all migrations from scratch, and re-seeds.
Only use on your local dev machine.

### Generate Prisma client (after schema changes)

```bash
pnpm exec prisma generate
```

Run this whenever `schema.prisma` changes if the client isn't auto-regenerated.

### Open Prisma Studio (visual DB browser)

```bash
pnpm db:studio
# Opens: http://localhost:5555
```

---

## How to Create a Safe Migration

### Step 1: Modify `prisma/schema.prisma`

Example — adding a nullable column to `tasks`:

```prisma
// Before
model Task {
  id     String @id @default(cuid())
  title  String
  status TaskStatus
}

// After
model Task {
  id             String  @id @default(cuid())
  title          String
  status         TaskStatus
  completedNote  String?   // <-- new nullable column
}
```

### Step 2: Generate the migration

```bash
pnpm db:migrate:dev --name add_tasks_completed_note
```

### Step 3: Review the generated SQL

Open `prisma/migrations/TIMESTAMP_add_tasks_completed_note/migration.sql`:

```sql
-- Expected output (Prisma generates this)
ALTER TABLE "tasks" ADD COLUMN "completed_note" TEXT;
```

**Review checklist**:
- [ ] Is the column nullable or does it have a default? (Required for backward compat)
- [ ] Is any index created with `CONCURRENTLY`? (Required for large tables in prod)
- [ ] Does the migration do only one thing? (Keep migrations small)
- [ ] Is there any data migration that should be separate?

### Step 4: Write a down migration

Create `prisma/migrations/TIMESTAMP_add_tasks_completed_note/down.sql`:

```sql
-- Revert: add_tasks_completed_note
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "completed_note";
```

### Step 5: Write a README for the migration

Create `prisma/migrations/TIMESTAMP_add_tasks_completed_note/README.md`:

```markdown
## Migration: add_tasks_completed_note

**Date**: 2026-09-23
**Author**: your-name

### What changed
Added nullable `completed_note` TEXT column to `tasks` table.
Users can optionally add a note when completing a task.

### Rollback
Run down.sql. The column is nullable so no data is lost.
No code changes needed for rollback (old code ignores the column).

### Verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'completed_note';
```

### Step 6: Commit everything together

```bash
git add prisma/schema.prisma
git add prisma/migrations/
git add apps/api/src/modules/tasks/  # code changes that use the new column
git commit -m "feat(tasks): add optional completion note to task"
```

---

## Migration Rules

> These rules ensure every migration is safely rollback-able. PR review **must**
> verify these for any migration file.

| Rule | Good ✅ | Bad ❌ |
|------|---------|--------|
| New columns are nullable or have a default | `ADD COLUMN note TEXT` | `ADD COLUMN note TEXT NOT NULL` |
| No column renames | Add new + deprecate old | `RENAME COLUMN x TO y` |
| No type changes without copy | Add new column with new type, backfill, drop old | `ALTER COLUMN x TYPE BIGINT` |
| NOT NULL added only after backfill | See example below | `ALTER COLUMN x SET NOT NULL` without backfill |
| Large-table index uses CONCURRENTLY | `CREATE INDEX CONCURRENTLY…` | `CREATE INDEX…` (takes lock) |
| Schema migration ≠ data migration | Keep them in separate files | Mix DDL + UPDATE in same file |

### Safe NOT NULL column pattern

```sql
-- Step 1: Add nullable (this migration)
ALTER TABLE "tasks" ADD COLUMN "priority" INTEGER;

-- Step 2: Backfill (this migration, before NOT NULL)
UPDATE "tasks" SET "priority" = 1 WHERE "priority" IS NULL;

-- Step 3: Add constraint (this migration, after backfill)
ALTER TABLE "tasks" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 1;
```

### Safe index creation on large tables

```sql
-- Use CONCURRENTLY to avoid locking the table
CREATE INDEX CONCURRENTLY "idx_tasks_user_status"
  ON "tasks"("user_id", "status");
```

> Note: `CONCURRENTLY` cannot run inside a transaction. Prisma's migration runner
> wraps migrations in transactions by default. For CONCURRENT index creation, add
> `-- prisma-migrate: disable-transaction` as the first line of the migration SQL.

---

## Running Migrations in CI

Migrations run automatically in the CI pipeline after the build step:

```yaml
# ci.yml (excerpt)
- name: Migration check
  run: pnpm db:migrate
  env:
    DATABASE_URL: postgresql://saar_test:saar_test@localhost:5433/saar_test
```

The CI uses an ephemeral test database (port 5433) that is destroyed after the run.
This verifies the migration applies cleanly from scratch.

---

## Running Migrations in Staging

Staging migrations run automatically via `deploy-staging.yml`:

```bash
# Triggered automatically on push to develop
pnpm db:migrate  # against $STAGING_DATABASE_URL
```

Monitor the GitHub Actions run to see migration output.

---

## Running Migrations in Production

Production migrations are a **controlled, manual step** in `deploy-production.yml`:

1. Trigger `deploy-production.yml` from GitHub Actions → Run workflow
2. Migration dry-run shows pending migrations (review in workflow log)
3. Approve the run (required reviewer gates here)
4. Migration step runs: `prisma migrate deploy` against `$PROD_DATABASE_URL`
5. Deploy step runs after migrations succeed

If the migration step fails:
- The deploy step is skipped (safe — old code is still running)
- Investigate: check workflow logs for the exact SQL that failed
- Fix the migration in a new commit and re-trigger

---

## Rolling Back a Migration

> ⚠️ This is a manual process. There is no automated rollback. Proceed carefully.

### Step 1: Identify the migration to revert

```bash
pnpm exec prisma migrate status
# Look for the most recently applied migration
```

### Step 2: Apply the down migration

```bash
# Connect to the target database
psql $DATABASE_URL

# Apply the down migration
\i prisma/migrations/TIMESTAMP_migration_name/down.sql

# Verify the change was reverted
\d tablename
```

### Step 3: Remove the migration from Prisma's history

```sql
-- This tells Prisma the migration was rolled back
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260923_001_add_tasks_completed_note';
```

### Step 4: Revert the application code

Deploy the previous application version (see [ADR-010](../adr/ADR-010-deployment-rollback.md)).

### Step 5: Verify

```bash
pnpm exec prisma migrate status  # Should show migration as not applied
curl http://localhost:3000/ready  # Should return 200
```

---

## Diagnosing Migration Issues

### `Migration N is not yet applied` (status shows drift)

The DB has more migrations than the codebase. Usually happens after a rollback.

```bash
pnpm exec prisma migrate status
# Shows: "Prisma Migrate detected X unapplied migrations"
```

Action: Apply with `pnpm db:migrate` or reconcile manually.

### `P3018: A migration failed to apply`

A migration SQL errored mid-way. Prisma marks it as failed.

```bash
# View the failing migration
pnpm exec prisma migrate status

# Check the specific error
pnpm exec prisma migrate resolve --rolled-back MIGRATION_NAME
# Then fix the migration SQL and re-apply
```

### `P3005: The database schema is not empty`

Trying to run `migrate dev` on a DB that has tables not tracked by Prisma.

```bash
# Baseline the existing schema
pnpm exec prisma migrate resolve --applied MIGRATION_NAME
```

### Schema drift detected

Prisma reports the DB schema doesn't match the expected state.

```bash
pnpm exec prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url $DATABASE_URL
```

---

## Emergency Contacts

| Situation                          | Action                                                          |
|------------------------------------|------------------------------------------------------------------|
| Migration corrupted production data| Immediately raise P0 incident, revert application, execute down.sql |
| Migration running > 60 seconds     | Check if table lock is blocking; kill blocking queries if safe   |
| Can't connect to prod DB           | Check `PROD_DATABASE_URL` secret in GitHub Environments         |
| Prisma client out of sync          | `pnpm exec prisma generate` on the deploy server               |

---

*See also: [ADR-003 (PostgreSQL + Prisma)](../adr/ADR-003-postgresql-prisma.md) · [ADR-010 (Deployment & Rollback)](../adr/ADR-010-deployment-rollback.md)*
