# ADR-001: Modular Monolith vs Microservices

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead                          |

---

## Context

SAAR is a personal productivity and coaching platform. At the start of Phase 1, the
engineering team consists of one to three people. The full feature surface spans:

- User authentication and sessions
- Life area and goal management
- Task scheduling and tracking
- Daily check-ins
- AI-powered coaching and insight generation
- Notification and alarm management
- Subscription and entitlement management

The core architectural question is whether to **decompose these domains immediately into
separate deployable microservices** or to **keep them in a single deployable unit with
strong internal boundaries**.

### Options Considered

| Option                     | Pros                                           | Cons                                              |
|----------------------------|------------------------------------------------|---------------------------------------------------|
| **Microservices**          | Independent scalability, team autonomy         | Network overhead, distributed transactions, ops burden, premature for team size |
| **Modular Monolith**       | Simpler ops, fast iteration, shared DB, refactorable | Single deploy unit, risk of boundary erosion if not disciplined |
| **Serverless functions**   | Zero-ops, scales to zero                       | Cold starts hurt UX, poor for long-running AI jobs, vendor lock-in |

---

## Decision

**We start with a modular monolith using NestJS with strict module boundaries.**

Each business domain is a separate NestJS module:

```
apps/api/src/
  modules/
    auth/          # AuthModule
    users/         # UsersModule
    life-areas/    # LifeAreasModule
    goals/         # GoalsModule
    tasks/         # TasksModule
    routines/      # RoutinesModule
    checkins/      # CheckinsModule
    ai-core/       # AiCoreModule (adapter only)
    insights/      # InsightsModule
    notifications/ # NotificationsModule
    subscriptions/ # SubscriptionsModule
    outbox/        # OutboxModule (event relay)
```

### Boundary Enforcement Rules

1. **No cross-module direct imports of repositories.** Modules expose only public
   services — internal repository classes are `@Injectable()` but not exported.
2. **Cross-module communication via public service interfaces** declared in a shared
   `contracts/` package, not concrete implementations.
3. **Domain events** (via the Outbox pattern — see ADR-004) are the only way to trigger
   side effects in another module.
4. **Database access** is mediated through Prisma in the module that owns the table.
   No module queries another module's table directly.
5. **Module circular dependency checks** run in CI (`eslint-plugin-boundaries`).

---

## Consequences

### Positive
- **Faster iteration**: one deploy, one CI pipeline, no network calls between modules.
- **Shared database transactions**: an auth change and a profile change can happen
  atomically in one Prisma transaction.
- **Low operational overhead**: no service mesh, no distributed tracing across
  deployment units, no Kubernetes in Phase 1.
- **Refactorable**: modules with clean boundaries can be extracted to microservices
  later with mostly copy-paste effort.

### Negative / Risks
- A bug in one module can crash the entire process. **Mitigation**: process-level
  health checks + container restart policy.
- Shared database means schema migrations must be backward-compatible.
  **Mitigation**: ADR-010 migration protocol.
- Discipline required to not break module boundaries. **Mitigation**: eslint-plugin-boundaries + PR review gate.

---

## Revisit Criteria

Revisit this decision when **any** of the following are true:

| Signal                                    | Threshold         |
|-------------------------------------------|-------------------|
| Daily Active Users                        | ≥ 10,000 DAU      |
| Team size requiring independent deploy    | ≥ 4 backend teams |
| AI inference latency hurting API p99      | > 10 s sustained  |
| Module isolation failures in prod         | ≥ 3 incidents     |

At that point, evaluate extracting the `ai-core` or `notifications` module first,
as they have the most distinct scaling profiles.

---

## References

- [NestJS Modular Architecture](https://docs.nestjs.com/modules)
- [Building Microservices – Sam Newman, Ch. 1: Just Enough Microservices]
- [Software Architecture: The Hard Parts – Ford, Richards, Sadalage, Dehghani]
