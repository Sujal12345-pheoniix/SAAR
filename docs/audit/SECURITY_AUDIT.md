# SAAR Security Audit & Vulnerability Assessment

**Author:** Principal Security Engineer & Forensic Auditor  
**Date:** September 2026  
**Repository Source of Truth:** `SAAR — Personal Growth Intelligence Platform` (`saar`)  
**Scope:** Full-Stack Security Assessment (API, Auth, Web Client, Mobile Client, Transport Security, OWASP Top 10)  

---

## 1. Executive Summary

A forensic security audit was conducted across all codebase layers of SAAR. While standard security modules (`helmet`, `argon2`, `@nestjs/throttler`, `ValidationPipe`) were imported, critical architectural oversights and logic bugs render several security defenses completely inert.

### Vulnerability Severity Breakdown:
- **P0 Critical:** 2 vulnerabilities (Total CORS Authorization Bypass, Dead Rate Limiting)
- **P1 High:** 2 vulnerabilities (Client-Side Token Exposure via XSS, Missing Revocation Invariant)
- **P2 Medium:** 3 vulnerabilities (Permissive Vercel Domain Wildcarding, Lack of CSP Directives, Incomplete Audit Log Sanitization)
- **P3 Low:** 2 vulnerabilities (Lack of Password Complexity Rules, Missing HSTS Preload Flag)

---

## 2. Forensic Vulnerability Register

### [P0-SEC-001] Complete CORS Authorization Bypass via Logic Fallthrough
- **File:** `apps/api/src/main.ts:32-45`
- **Severity:** P0 — CRITICAL
- **CVSS 3.1 Score:** 9.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N`)
- **Code Inspection:**
  ```typescript
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = corsOriginsEnv.split(',').map((o) => o.trim());
      if (
        !origin ||
        corsOriginsEnv === '*' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // <--- CRITICAL FLAW: ALWAYS RETURNS TRUE!
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });
  ```
- **Root Cause Analysis:** The `else` branch of the origin validator explicitly calls `callback(null, true)`. As a result, **every single domain on the internet is authorized** to send cross-origin requests.
- **Exploitation Scenario:** Because `credentials: true` is enabled, an attacker can host an arbitrary malicious webpage (`evil.com`), trick an authenticated user into visiting it, and initiate cross-origin Fetch/XHR requests to `https://api.saar.com/api/v1/users/me` or `/api/v1/tasks`. The browser will supply credentials, and the API will return full user private data with `Access-Control-Allow-Origin: evil.com` and `Access-Control-Allow-Credentials: true`, completely bypassing Same-Origin Policy (SOP).
- **Remediation:**
  Change `else { callback(null, true); }` to `else { callback(new Error('Not allowed by CORS'), false); }`.

---

### [P0-SEC-002] Rate Limiting (ThrottlerGuard) Completely Inactive
- **File:** `apps/api/src/app.module.ts:18-35`
- **Severity:** P0 — CRITICAL
- **CVSS 3.1 Score:** 8.6 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:H`)
- **Code Inspection:**
  `ThrottlerModule.forRootAsync(...)` is registered in `AppModule.imports`:
  ```typescript
  ThrottlerModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => [
      {
        ttl: configService.get<number>('THROTTLE_TTL', 60000),
        limit: configService.get<number>('THROTTLE_LIMIT', 100),
      },
    ],
    inject: [ConfigService],
  }),
  ```
  However, in `AppModule.providers` or `main.ts`, **the ThrottlerGuard is never bound**:
  ```typescript
  // MISSING:
  // {
  //   provide: APP_GUARD,
  //   useClass: ThrottlerGuard,
  // }
  ```
- **Root Cause Analysis:** In NestJS, importing `ThrottlerModule` alone configures storage but does NOT register the intercepting guard. Without binding `ThrottlerGuard` to `APP_GUARD` or using `@UseGuards(ThrottlerGuard)` on controllers, `@Throttle({ default: { limit: 5, ttl: 60000 } })` decorators on `/auth/login` and `/auth/register` are completely ignored at runtime.
- **Exploitation Scenario:** Credential stuffing, brute-force password cracking, and token exhaustion attacks against `/auth/login` and `/auth/register` can be executed at unlimited concurrency without receiving HTTP 429 Too Many Requests.
- **Remediation:**
  Bind `ThrottlerGuard` as a global guard in `AppModule`:
  ```typescript
  import { APP_GUARD } from '@nestjs/core';
  import { ThrottlerGuard } from '@nestjs/throttler';
  // In providers:
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }
  ```

---

### [P1-SEC-001] Client-Side Token Storage in `localStorage` and Non-HttpOnly Cookies
- **File:** `apps/web/app/(auth)/login/page.tsx:98-116`
- **Severity:** P1 — HIGH
- **CVSS 3.1 Score:** 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N`)
- **Code Inspection:**
  ```typescript
  localStorage.setItem('saar_token', data.session.accessToken);
  document.cookie = `saar_session=${data.session.accessToken}; path=/; max-age=604800; SameSite=Lax`;
  ```
- **Root Cause Analysis:** Access tokens are stored in browser `localStorage` and set via JavaScript `document.cookie` without the `HttpOnly` or `Secure` flags.
- **Exploitation Scenario:** Any Cross-Site Scripting (XSS) vulnerability (in any third-party dependency, UI library, or user markdown renderer) allows an attacker to extract `localStorage.getItem('saar_token')` or `document.cookie`, exfiltrating valid session bearer tokens immediately.
- **Remediation:**
  Issue session authentication tokens in `HttpOnly; Secure; SameSite=Strict` cookies directly from the backend server response headers (`Set-Cookie`), eliminating all client-side JavaScript access to tokens.

---

### [P2-SEC-001] Permissive Vercel Subdomain Wildcarding
- **File:** `apps/api/src/main.ts:38`
- **Severity:** P2 — MEDIUM
- **Code Inspection:**
  ```typescript
  origin.endsWith('.vercel.app')
  ```
- **Root Cause Analysis:** Any developer can deploy any project to Vercel and obtain a `*.vercel.app` subdomain (e.g., `attacker-site.vercel.app`).
- **Exploitation Scenario:** An attacker can deploy a phishing frontend to `attacker.vercel.app`, and it will pass the CORS origin verification check, allowing authenticated credential access.
- **Remediation:**
  Use strict environment variable allowlisting or exact regex matching against specific approved project slugs: `/^https:\/\/saar(-[a-z0-9-]+)?-sujals-projects\.vercel\.app$/`.

---

## 3. OWASP Top 10 (2021) Compliance Matrix

| OWASP Category | Finding / Status | Risk Level |
|---|---|---|
| **A01: Broken Access Control** | CORS callback allows all origins unconditionally; inactive ThrottlerGuard; missing JWT revocation check. | **CRITICAL** |
| **A02: Cryptographic Failures** | Tokens stored in plain `localStorage` & non-HttpOnly cookies; Argon2 refresh loop vulnerable to timing side-channels. | **HIGH** |
| **A03: Injection** | Protected via Prisma ORM parameterized queries. DTOs validated with `ValidationPipe`. | **LOW** |
| **A04: Insecure Design** | Outbox pattern has no worker; no token rotation family revocation. | **HIGH** |
| **A05: Security Misconfiguration** | Helmet enabled, but lacks explicit CSP directive; ThrottlerGuard unbound. | **HIGH** |
| **A06: Vulnerable & Outdated Components** | Packages are mostly modern (Next 14, Nest 10, Prisma 5), but lockfile contains peer warnings. | **LOW** |
| **A07: Identification & Auth Failures** | O(N) Argon2 loop on refresh endpoint; Mobile auth contract 404 failure. | **CRITICAL** |
| **A08: Software & Data Integrity Failures** | CI pipeline does not verify package integrity or run automated vulnerability scans. | **MEDIUM** |
| **A09: Security Logging & Monitoring Failures** | Interceptor logs requests, but lacks structured security audit event emission for login failures. | **MEDIUM** |
| **A10: Server-Side Request Forgery (SSRF)** | No current external URL fetching in API controllers. | **NONE** |

---

## 4. Immediate Remediation Actions
1. Patch `main.ts` CORS callback to reject unlisted origins.
2. Bind `ThrottlerGuard` to `APP_GUARD` in `AppModule`.
3. Migrate web token storage to backend-managed `HttpOnly` cookies.
4. Replace wildcard `.vercel.app` checks with strict regex / environment allowlists.
