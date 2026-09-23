---
title: SAAR API Security Checklist
version: 1.0
phase: 1
---

# API Security Checklist

Every API endpoint must satisfy these controls before merging.

## Authentication
- [ ] Protected routes have `@UseGuards(JwtAuthGuard)`
- [ ] Public routes are explicitly decorated `@Public()`
- [ ] JWT signature verified on every request
- [ ] Expired tokens rejected (401)
- [ ] Revoked sessions checked (401)

## Authorization
- [ ] Every resource route checks `userId === resource.userId`
- [ ] No client-provided `userId` accepted in request body
- [ ] 403 or 404 returned for unauthorized resources (not 200)
- [ ] Role checks DO NOT replace ownership checks

## Input Validation
- [ ] All request bodies validated with `class-validator`
- [ ] `ValidationPipe` has `whitelist: true, forbidNonWhitelisted: true`
- [ ] String lengths bounded
- [ ] Numeric ranges validated
- [ ] Enum values validated
- [ ] Date ranges validated
- [ ] IANA timezone validated where applicable

## Output Filtering
- [ ] `passwordHash` never returned
- [ ] `refreshHash` never returned
- [ ] `ipAddress` never returned to client
- [ ] Internal Prisma errors never exposed in production
- [ ] Stack traces never exposed in production

## Rate Limiting
- [ ] Auth endpoints rate limited (register: 5/min, login: 10/min)
- [ ] AI/expensive endpoints separately limited
- [ ] Rate limit headers returned (X-RateLimit-*)

## Headers
- [ ] `X-Request-Id` on every response
- [ ] `helmet()` applied (X-Frame-Options, HSTS, etc.)
- [ ] CORS restricted to allowed origins only
- [ ] `Content-Security-Policy` set

## Audit
- [ ] Auth events logged to AuditLog (register, login, logout, session revoke)
- [ ] Critical mutations logged with actorType, action, entityType, entityId
- [ ] AuditLog never deleted by users

## Idempotency
- [ ] Retry-prone POSTs accept `Idempotency-Key` header
- [ ] Same key + same body returns same response
- [ ] Same key + different body returns 409

## IDOR Testing
- [ ] Test: user A cannot access user B's goals/tasks/conversations
- [ ] Test: user A cannot delete user B's sessions
- [ ] Test: unauthenticated request returns 401
- [ ] Test: authenticated but unauthorized returns 403/404
