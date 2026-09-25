# SAAR Authorization & Access Control Audit

**Author:** Principal Security Engineer & Forensic Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Access Control Architecture, Multi-Tenancy Isolation, IDOR (Insecure Direct Object Reference) Verification, Role-Based Access Control (RBAC)  

---

## 1. Executive Summary

Authorization in SAAR follows a tenant-isolated single-database architecture where each resource belongs to a specific user (`userId`). Access control is enforced primarily at two layers:
1. **Route Guard Level:** `JwtAuthGuard` authenticates caller identity and extracts `req.user`. `RolesGuard` evaluates role annotations (`@Roles('USER', 'ADMIN')`).
2. **Data Layer Query Level:** NestJS application services inject `userId: req.user.id` into Prisma query `where` clauses.

Our forensic audit determined that **primary resource CRUD operations strictly enforce tenant ownership filters**, mitigating direct IDOR vulnerabilities on top-level entities (Tasks, Goals, Life Areas). However, several critical authorization vulnerabilities were identified in **nested entity mutations (milestones, subtasks), role-elevation guards, and administrative endpoints**.

---

## 2. Guard Implementation & Hierarchy

### 2.1 Role-Based Access Control (`RolesGuard`)
- **File:** `apps/api/src/common/guards/roles.guard.ts`
- **Inspection:**
  ```typescript
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!requiredRoles) {
        return true;
      }
      const { user } = context.switchToHttp().getRequest();
      return requiredRoles.some((role) => user.role === role);
    }
  }
  ```
- **Finding:**
  1. The `RolesGuard` properly checks handler and class metadata via NestJS `Reflector`.
  2. **Vulnerability [P2-AUTHZ-001]:** In `apps/api/src/app.module.ts`, `RolesGuard` is NOT registered as a global guard. As a result, if a developer annotates a controller method with `@Roles('ADMIN')` but forgets to explicitly decorate the controller with `@UseGuards(JwtAuthGuard, RolesGuard)`, **the role requirement is silently bypassed**.
  3. `user.role` is populated directly from the unsigned JWT token payload (`payload.role`) without database verification. If an admin demotes a user in the database, the user retains administrative access until token expiration.

---

## 3. Insecure Direct Object Reference (IDOR) Forensic Analysis

We audited every mutating service method across all 9 business modules for IDOR vulnerabilities:

### 3.1 Top-Level Resources (Secure)
- **Tasks (`tasks.service.ts`):**
  ```typescript
  await this.prisma.task.findFirst({ where: { id, userId } });
  await this.prisma.task.updateMany({ where: { id, userId }, data });
  ```
  *Verdict:* Properly scoped with composite `where: { id, userId }`.
- **Goals (`goals.service.ts`):**
  ```typescript
  await this.prisma.goal.findFirst({ where: { id, userId } });
  ```
  *Verdict:* Scoped to `userId`.
- **Life Areas (`life-areas.service.ts`):**
  ```typescript
  await this.prisma.lifeArea.findFirst({ where: { id, userId } });
  ```
  *Verdict:* Scoped to `userId`.

### 3.2 Nested Resources & Cascading IDOR Risks
- **Subtask Modification (`P2-AUTHZ-002`):**
  - **Location:** `apps/api/src/modules/tasks/tasks.service.ts:182-195`
  - **Inspection:** In subtask updates, the service executes:
    ```typescript
    await this.prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted, title },
    });
    ```
  - **Flaw:** The query filters only on `where: { id: subtaskId }`. It fails to verify that the parent task belongs to `userId`!
  - **Exploit:** User A can modify or toggle the completion status of User B's subtask simply by knowing or guessing User B's `subtaskId`.
  - **Remediation:** Join parent task ownership in the query or verify parent task `userId`:
    ```typescript
    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });
    if (!subtask || subtask.task.userId !== userId) throw new NotFoundException();
    ```

- **Goal Milestone Modification (`P2-AUTHZ-003`):**
  - **Location:** `apps/api/src/modules/goals/goals.service.ts:145-160`
  - **Flaw:** Milestone deletion checks only `where: { id: milestoneId }` rather than verifying the associated `goal.userId`.
  - **Remediation:** Enforce goal tenant ownership check prior to executing milestone mutation.

---

## 4. Multi-Tenancy Data Isolation Guarantee

| Entity | Tenant Column | Enforced at Service Layer | Risk Level |
|---|---|---|---|
| `User` / `UserProfile` | `id` / `userId` | Yes (`req.user.id`) | Low |
| `FutureSelf` | `userId` | Yes | Low |
| `LifeArea` | `userId` | Yes | Low |
| `Goal` | `userId` | Yes | Low |
| `GoalMilestone` | Linked via `goalId` | **No** (Direct `id` update without parent verification) | **High** |
| `Task` | `userId` | Yes | Low |
| `Subtask` | Linked via `taskId` | **No** (Direct `id` update without parent verification) | **High** |
| `Routine` | `userId` | Yes | Low |
| `DailyGrowthLog` | `userId` | Yes | Low |
| `BehaviorEvent` | `userId` | Yes | Low |

---

## 5. Remediation Plan

1. **Fix Nested IDORs:** Patch `Subtask` and `GoalMilestone` mutation queries to assert that the parent entity's `userId` matches `req.user.id`.
2. **Global RolesGuard:** Register `RolesGuard` in `AppModule` with `APP_GUARD`.
3. **Database-Verified Role Checks:** For sensitive role-restricted actions, look up the user's live role from the database or Redis cache rather than relying solely on the JWT payload.
