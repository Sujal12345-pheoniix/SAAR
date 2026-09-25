# SAAR Database Architecture & Schema Audit

**Author:** Principal Database Architect & Forensic Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** PostgreSQL Schema, Prisma ORM, Migrations, Indexing, Referential Integrity, Connection Pooling  

---

## 1. Executive Summary

The SAAR database layer is backed by PostgreSQL (hosted on Neon Serverless Postgres) and managed via Prisma ORM v5.22.0. The schema contains **20 models, 7 enums, and 31 foreign key relations**.

While the schema structure reflects a mature domain model covering identity, life architecture, and event streaming, the forensic audit identified:
1. **A P0 Critical Seed Failure** that crashes database initialization on clean deployments.
2. **Missing Composite Indexes** that will trigger full index/table scans under production query patterns.
3. **PgBouncer / Neon Connection Pooler hazards** due to prepared statement caching.
4. **An unmanaged Outbox Table** that accumulates records indefinitely without TTL or compaction.

---

## 2. Forensic Findings & Code Evidence

### [P0-DB-001] Broken Database Seed Script (`PrismaClientValidationError`)
- **File:** `prisma/seed/index.ts:53-63`
- **Severity:** P0 — CRITICAL BLOCKER
- **Reproduction Command:** `pnpm db:seed`
- **Code Inspection:**
  ```typescript
  const user = await prisma.user.upsert({
    where: { email: 'demo@saar.ai' },
    update: {},
    create: {
      email: 'demo@saar.ai',
      passwordHash,
      displayName: 'Demo User',     // <--- DOES NOT EXIST ON User MODEL!
      isEmailVerified: true,        // <--- DOES NOT EXIST ON User MODEL!
      role: 'USER',
    },
  });
  ```
- **Prisma Schema Definition (`prisma/schema.prisma:18-35`):**
  ```prisma
  model User {
    id           String        @id @default(uuid())
    email        String        @unique
    passwordHash String
    role         Role          @default(USER)
    createdAt    DateTime      @default(now())
    updatedAt    DateTime      @updatedAt
    profile      UserProfile?
    // ...
  }
  ```
- **Error Output on Execution:**
  ```
  Invalid `prisma.user.upsert()` invocation:
  Unknown argument `displayName`. Did you mean `profile`?
  Unknown argument `isEmailVerified`.
  ```
- **Impact:** Clean development setups, CI database testing, and staging database seed scripts crash immediately. No developer or CI runner can seed a fresh test database without manual intervention.
- **Remediation:**
  Update `prisma/seed/index.ts` to create the `UserProfile` relation separately or via nested `create`:
  ```typescript
  create: {
    email: 'demo@saar.ai',
    passwordHash,
    role: 'USER',
    profile: {
      create: {
        displayName: 'Demo User',
      },
    },
  }
  ```

---

## 3. Schema Indexing & Query Performance Analysis

We evaluated all 20 models against the high-frequency query patterns in `apps/api/src/modules/`:

| Model | High-Frequency Query | Current Indexes | Optimization Verdict / Missing Composite Index |
|---|---|---|---|
| `Task` | `findMany({ where: { userId, status, dueDate } })` | `@@index([userId])`<br>`@@index([status])`<br>`@@index([dueDate])` | **Suboptimal**: 3 separate single-column indexes force PostgreSQL to perform BitmapAnd operations. **Requires `@@index([userId, status, dueDate])`**. |
| `DailyGrowthLog` | `findUnique({ where: { userId_date } })` | `@@unique([userId, date])` | **Optimal**: Unique composite constraint provides exact-match B-tree index. |
| `Session` | `findMany({ where: { userId, revokedAt, expiresAt } })` | `@@index([userId])`<br>`@@index([expiresAt])` | **Suboptimal**: Missing `@@index([userId, revokedAt, expiresAt])`. |
| `OutboxEvent` | Worker poll: `findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } })` | `@@index([status])`<br>`@@index([createdAt])` | **Suboptimal**: High-throughput polling requires compound index `@@index([status, createdAt])`. |
| `BehaviorEvent` | `findMany({ where: { userId, eventType, timestamp } })` | `@@index([userId])`<br>`@@index([eventType])` | **Suboptimal**: Missing composite index `@@index([userId, timestamp DESC])`. |
| `Goal` | `findMany({ where: { userId, status } })` | `@@index([userId])`<br>`@@index([status])` | **Suboptimal**: Add `@@index([userId, status])`. |

---

## 4. Referential Integrity & Cascade Semantics

All 31 relationships in `prisma/schema.prisma` were audited for deletion cascading:
- **Root User Deletion (`onDelete: Cascade`):** Correctly cascades across all user-owned data (`UserProfile`, `Session`, `FutureSelf`, `LifeArea`, `Goal`, `Task`, `Routine`, `DailyGrowthLog`, `BehaviorEvent`).
- **Goal Deletion (`onDelete: Cascade`):** Correctly cascades to `GoalMilestone`, `Plan`, and disassociates or cascades `Task`.
- **Soft Deletion Gap:** The schema uses hard foreign key cascading (`onDelete: Cascade`). There is no global soft-deletion mechanism (`deletedAt`). Accidental user or goal deletion causes immediate, non-recoverable data loss in production.

---

## 5. Neon Serverless Postgres & Connection Pooling

- **Neon Connection String:** `postgresql://neondb_owner:...@ep-spring-lake-b5ase8bn-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Architecture Risk:** Neon pooler uses PgBouncer in transaction pooling mode.
  1. **Prepared Statement Collision:** Prisma Client enables prepared statements by default. When connected to a transaction pooler without `?pgbouncer=true`, PostgreSQL throws error `prepared statement "s0" already exists` or `prepared statement does not exist`.
  2. **Connection Limits:** In `prisma.service.ts`, PrismaClient is instantiated with default pool settings. Under serverless auto-scaling or multi-instance API deployments, Prisma will open up to `(num_cpus * 2) + 1` connections per instance, potentially exceeding Neon connection limits.
- **Remediation:**
  Append `&pgbouncer=true` to `DATABASE_URL` in `.env.example` and set `connection_limit=10` on the connection string.
