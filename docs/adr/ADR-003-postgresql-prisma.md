# ADR-003: PostgreSQL + Prisma as Data Foundation

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead                          |

---

## Context

SAAR requires a persistent, reliable data store for:

- Transactional writes (goal creation, task completion, payment events)
- Relational data (users → life areas → goals → tasks)
- Flexible metadata (AI memory snippets, notification preferences, insight data)
- Versioned schema evolution as the product grows
- Full-text search potential (goal/task text search in Phase 2)

### Options Considered

| Database              | Pros                                             | Cons                                                    |
|-----------------------|--------------------------------------------------|---------------------------------------------------------|
| **PostgreSQL**        | ACID, JSONB, full-text search, mature ecosystem  | More setup than SQLite; heavier than NoSQL for simple KV |
| **MongoDB**           | Flexible schema, easy for prototyping            | No ACID by default across documents, joins are painful   |
| **MySQL/MariaDB**     | Familiar, widely hosted                          | Weaker JSONB support, strict mode quirks                 |
| **SQLite**            | Zero setup, embedded                             | Not suitable for multi-process server, no concurrency    |
| **PlanetScale/Neon**  | Serverless, branching                            | Vendor lock-in, latency variability                      |

### ORM Options Considered

| ORM / Query Builder   | Pros                                             | Cons                                                    |
|-----------------------|--------------------------------------------------|---------------------------------------------------------|
| **Prisma**            | Type-safe, schema-first, excellent DX, migrations| Slight abstraction overhead, limited raw SQL ergonomics  |
| **Drizzle ORM**       | SQL-first, lightweight, very fast                | Less mature migration tooling at time of decision        |
| **TypeORM**           | Widely used, decorator-based                     | Complex, bugs with relations, maintenance slowdown       |
| **Knex.js**           | Flexible query builder                           | No types without extras, verbose                         |

---

## Decision

**PostgreSQL 16 is the system of record. Prisma is the ORM for all standard queries.
Raw SQL (via `prisma.$queryRaw`) is allowed for performance-tuned queries. Redis is
never authoritative — it is a cache and queue only.**

### Architecture Principles

```
┌─────────────────────────────────────────────────────────────────┐
│  Source of Truth Hierarchy                                        │
│                                                                   │
│  1. PostgreSQL  ← AUTHORITATIVE for all business data             │
│  2. Prisma ORM  ← Type-safe interface to PostgreSQL              │
│  3. Redis       ← Cache, queues, rate limiting (ephemeral)        │
│  4. In-memory   ← Request-scoped only                            │
└─────────────────────────────────────────────────────────────────┘
```

### Why PostgreSQL

1. **ACID transactions** — goal creation + outbox event write must be atomic.
2. **JSONB columns** — AI memory facts, notification preferences, step definitions,
   and insight metadata fit naturally in JSONB without over-normalizing.
3. **Row-level security (future)** — if multi-tenancy is added, RLS provides a
   DB-layer safety net.
4. **Extensions** — `pgcrypto` for UUID generation, `pg_trgm` for fuzzy search
   (Phase 2), `uuid-ossp` as fallback.
5. **Managed hosting options** — Supabase, Neon, RDS, Railway all support
   PostgreSQL 16 with minimal lock-in.

### Why Prisma

1. **Type safety end-to-end** — schema changes propagate to TypeScript types
   automatically after `prisma generate`.
2. **Migration history** — `prisma/migrations/` is version-controlled, making
   schema changes auditable and CI-testable.
3. **Prisma Studio** — low-cost data browser for debugging without a GUI client.
4. **Relation queries** — nested `include` and `select` eliminate most N+1 query
   patterns.

### Raw SQL Policy

Raw SQL is acceptable **only** when:
- The query requires a PostgreSQL-specific feature (e.g., window functions, CTEs
  with `WITH RECURSIVE`, `LATERAL` joins).
- A Prisma query has been profiled and shown to produce suboptimal SQL.
- The raw query is **tested** (snapshot test of the SQL string in CI).

```typescript
// Example: allowed raw SQL usage
const topGoals = await prisma.$queryRaw<GoalRow[]>`
  SELECT g.id, g.title, COUNT(t.id) as task_count
  FROM goals g
  LEFT JOIN tasks t ON t.goal_id = g.id
  WHERE g.user_id = ${userId}::uuid
  GROUP BY g.id
  ORDER BY task_count DESC
  LIMIT 10
`;
```

### JSONB Usage Guidelines

| Column                          | Table              | Reason                                      |
|---------------------------------|--------------------|---------------------------------------------|
| `preferences`                   | `user_profiles`    | Flexible, rarely queried by value            |
| `steps`                         | `routines`         | Ordered list, no foreign key needed          |
| `supporting_data`               | `insights`         | AI-generated, schema varies by insight type  |
| `metadata`                      | `behavior_events`  | Event payload varies by event type           |
| `notification_schedule`         | `notifications`    | Complex recurrence config                    |

---

## Consequences

### Positive
- Schema changes are version-controlled and reviewable in PRs.
- TypeScript types always match DB schema (no drift).
- JSONB provides flexibility without sacrificing transactional integrity.
- Migration tooling (prisma migrate deploy) integrates cleanly into CI/CD.

### Negative / Risks
- Prisma's generated SQL is not always optimal for complex reports.
  **Mitigation**: raw SQL allowed with testing requirement.
- Schema migrations are irreversible in production without explicit down-migration
  strategy. **Mitigation**: ADR-010 rollback protocol.
- Prisma's introspection of complex types (arrays, enums) sometimes requires manual
  overrides. **Mitigation**: document overrides inline in `schema.prisma`.

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL 16 Release Notes](https://www.postgresql.org/docs/16/release-16.html)
- [Use the index, Luke](https://use-the-index-luke.com/) — PostgreSQL query optimization
