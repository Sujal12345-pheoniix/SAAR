# SAAR Authentication & Identity Management Audit

**Author:** Principal Security Architect & CTO-Level Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Authentication Flow, Password Hashing, Session Lifecycle, Token Issuance & Refresh, Multi-Client Token Synchronization  

---

## 1. Executive Summary

Authentication in SAAR is implemented via a dual-token scheme (short-lived JWT access tokens and long-lived database-persisted refresh tokens) using NestJS, Passport-JWT, Argon2, and Prisma. 

Our forensic code audit identified **two P0 critical flaws** and **two P1 high vulnerabilities** that break authentication in production:
1. **Algorithmic CPU Denial-of-Service & Silent Refresh Failures** due to O(N) Argon2 session scanning on `/auth/refresh`.
2. **Total Mobile Authentication Failure** due to broken endpoint routes (`/auth/me` vs `/api/v1/me`) and mismatched response payloads.
3. **Stateless Access Token Revocation Blindness** where logged-out users retain valid access tokens for up to 15 minutes.
4. **Client-Side Refresh Token Discard** in the Web application causing unavoidable session termination every 15 minutes.

---

## 2. Forensic Findings & Code Evidence

### [P0-AUTH-001] O(N) Argon2 Loop on `/auth/refresh` — Algorithmic Denial of Service & Session Cap
- **File:** `apps/api/src/modules/auth/auth.service.ts:258-273`
- **Severity:** P0 — CRITICAL
- **Code Inspection:**
  ```typescript
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    // Look up active sessions
    const sessions = await this.prisma.session.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      take: 200, // <--- CAPPED AT 200 SESSIONS NATIONWIDE
    });

    let matchedSession: (typeof sessions)[0] | null = null;
    for (const session of sessions) {
      const isMatch = await argon2.verify(session.refreshHash, refreshToken); // <--- O(N) ARGON2 COMPUTATION
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    // ...
  }
  ```
- **Forensic Breakdown:**
  1. **Algorithmic CPU Exhaustion:** Argon2id is intentionally CPU- and memory-intensive (configured with `memoryCost: 65536, timeCost: 3`). A single verification consumes 50–100ms of single-threaded CPU time. If 100 active sessions exist, an invalid or miss refresh token verification requires computing up to 100 Argon2 hashes, blocking the CPU for **5 to 10 seconds per request**.
  2. **Trivial Remote DoS:** Because rate limiting is inactive (`P0-SEC-002`) and `/auth/refresh` is unauthenticated, an attacker sending 10 concurrent bogus refresh requests will lock up all Node.js worker threads for over a minute, knocking the entire API offline for all users.
  3. **Silent 401 Session Invalidation:** The query is hardcoded with `take: 200`. In a production system with >200 concurrent active sessions across all users, any valid user whose session falls outside the arbitrary top 200 rows will fail refresh with a 401 Unauthorized error and be logged out.
- **Root Cause:** Refresh tokens are generated as opaque random strings without encoding the `sessionId` in the token.
- **Remediation:**
  Structure refresh tokens as compound tokens containing the session identifier and token secret (e.g., `<sessionId>.<secret>` or signed JWT containing `sid`). The lookup becomes an $O(1)$ indexed query:
  ```typescript
  const [sessionId, secret] = rawRefreshToken.split('.');
  const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new UnauthorizedException();
  }
  const isValid = await argon2.verify(session.refreshHash, secret);
  ```

---

### [P0-MOB-001] Mobile Client Authentication Route Mismatch & Immediate Logout Crash
- **File:** `apps/mobile/context/AuthContext.tsx:67-96` & `apps/mobile/lib/api-client.ts`
- **Severity:** P0 — CRITICAL
- **Code Inspection:**
  ```typescript
  // In AuthContext.tsx:67 (bootstrap sequence)
  const user = await apiClient.get<User>('/auth/me'); // <--- 404 NOT FOUND!
  ```
  ```typescript
  // In AuthContext.tsx:94-96 (login response handler)
  const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  await SecureStorage.setTokens(res.accessToken, res.refreshToken); // <--- UNDEFINED!
  ```
- **Forensic Breakdown:**
  1. **Non-Existent Endpoint:** The mobile application attempts to verify user state by calling `GET /auth/me`. The NestJS API does NOT provide `GET /auth/me`; the user profile endpoint is `GET /api/v1/users/me` (or `GET /api/v1/me` via controller mapping). The resulting HTTP 404 triggers the `catch` block in `bootstrap()`, which calls `SecureStorage.clearTokens()`, immediately logging out any user on app launch.
  2. **Response Contract Fracture:** The NestJS API `/auth/login` endpoint returns:
     ```json
     {
       "user": { ... },
       "session": {
         "accessToken": "ey...",
         "refreshToken": "...",
         "expiresIn": 900,
         "sessionId": "..."
       }
     }
     ```
     `AuthContext.tsx` expects `res.accessToken` and `res.refreshToken` directly at the root. Both variables evaluate to `undefined`, storing invalid tokens in Expo SecureStore.
- **Remediation:**
  1. Add an alias `@Get('me')` to `AuthController` or update `AuthContext.tsx` to target `/api/v1/users/me`.
  2. Update `AuthContext.tsx` to read `res.session.accessToken` and `res.session.refreshToken` matching `@saar/contracts`.

---

### [P1-AUTH-001] Stateless JWT Strategy Ignores Revocation State
- **File:** `apps/api/src/modules/auth/strategies/jwt.strategy.ts:37-42`
- **Severity:** P1 — HIGH
- **Code Inspection:**
  ```typescript
  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sid,
    };
  }
  ```
- **Forensic Breakdown:**
  When a user logs out via `POST /auth/logout`, the server sets `session.revokedAt = new Date()`. However, `JwtStrategy.validate()` performs purely local cryptographic verification of the JWT signature. It **never checks Redis or Prisma** to see if the session was revoked or if the user account was suspended.
- **Impact:** An attacker who compromises an access token can continue accessing protected endpoints until the 15-minute token expires, regardless of whether the legitimate user logged out or changed their password.
- **Remediation:**
  Inject a fast cache check (Redis or in-memory LRU) in `JwtStrategy.validate` to verify `session:revoked:<sid>` or query `Session.revokedAt`.

---

### [P1-AUTH-002] Web Frontend Discards Refresh Token & Lacks Auto-Refresh Interceptor
- **File:** `apps/web/app/(auth)/login/page.tsx:98-116` & `apps/web/lib/api-client.ts`
- **Severity:** P1 — HIGH
- **Forensic Breakdown:**
  1. In `login/page.tsx`, the client receives `{ session: { accessToken, refreshToken } }`. It writes `accessToken` to `localStorage` and a non-HttpOnly cookie with a 7-day expiration (`max-age=604800`), but completely ignores `refreshToken`.
  2. `apps/web/lib/api-client.ts` contains only standard fetch wrappers without a 401 retry interceptor.
  3. Because access tokens expire in 15 minutes (`JWT_ACCESS_EXPIRES_IN=900`), any web user actively using the application is abruptly rejected with a 401 error after 15 minutes, losing all in-progress form inputs.
- **Remediation:**
  1. Store refresh tokens in `HttpOnly; SameSite=Strict` cookies.
  2. Implement an automatic refresh interceptor in `apps/web/lib/api-client.ts` that catches 401 responses, calls `/auth/refresh`, and transparently replays the failed request.

---

## 3. Password Hashing & Policy Analysis

- **Algorithm:** Argon2id (via `argon2` npm package).
- **Parameters:**
  ```typescript
  // auth.service.ts:31
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
  ```
- **Evaluation:** Argon2 parameters adhere to OWASP Cryptographic Storage recommendations.
- **Gap:** Minimum password length is enforced at 8 characters, but there are no entropy checks, common password blocklists, or breached password verification (HaveIBeenPwned API).

---

## 4. Session Data Model Analysis

The Prisma schema defines the `Session` model:
```prisma
model Session {
  id           String    @id @default(uuid())
  userId       String
  refreshHash  String
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([expiresAt])
}
```
- **Strengths:** Captures `userAgent`, `ipAddress`, `expiresAt`, `revokedAt`, and cascades deletions on user removal.
- **Gaps:** Lacks composite index `@@index([userId, revokedAt, expiresAt])` to optimize active session lookups.
- **Missing Cron:** No automated garbage collection exists to purge expired sessions from the database.
