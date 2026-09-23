# ADR-002: Authentication & Session Strategy

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead, Security Review         |

---

## Context

SAAR stores sensitive personal data: daily mood, energy levels, private goals, AI
coaching conversations, and financial aspirations. Authentication must be:

1. **Secure** — resist token theft, replay attacks, and credential stuffing.
2. **Usable** — users should stay logged in across sessions without constant
   re-authentication.
3. **Revocable** — if a device is lost or a session is suspected compromised, the user
   (or an admin) must be able to invalidate it immediately.

### Options Considered

| Strategy                        | Pros                                      | Cons                                             |
|---------------------------------|-------------------------------------------|--------------------------------------------------|
| **Pure stateless JWT**          | Simple, no DB lookups on every request    | Cannot revoke individual tokens, short-lived only |
| **Session cookies (server-side)**| Trivially revocable, simple to implement | Requires sticky sessions or shared session store |
| **JWT + rotating refresh tokens**| Revocable, short access tokens, device tracking | More complex, extra DB hit on refresh |
| **OAuth/OIDC (social login)**   | No password management, trusted providers | Dependency on third-party, Phase 1 scope creep  |

---

## Decision

**JWT access tokens (15 min TTL) + rotating refresh tokens (30 days TTL), with refresh
token hashes stored in the database. No social login in Phase 1.**

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│  Login (email + password)                                        │
│  → argon2id password verification                                │
│  → Issue:  access_token  (JWT, 15 min, HS256 w/ JWT_SECRET)     │
│            refresh_token (opaque 64-byte random, 30 days)        │
│  → Store:  SHA-256(refresh_token) in RefreshToken table          │
│            along with: userId, deviceId, userAgent, expiresAt    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  API Request                                                      │
│  → Validate access_token signature + expiry (no DB hit)          │
│  → Extract userId, sessionId from claims                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Token Refresh                                                    │
│  → Receive refresh_token (httpOnly cookie or request body)       │
│  → Compute SHA-256(refresh_token)                                │
│  → Look up in DB: must exist, not expired, not revoked           │
│  → Issue new access_token + new refresh_token (rotation)         │
│  → Revoke old refresh_token hash (replace in DB)                 │
│  → Refresh token reuse detection: if old token seen again,       │
│    revoke ENTIRE session family                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Logout                                                           │
│  → Delete refresh token record(s) from DB                        │
│  → Optional: blacklist access token for remaining TTL (Redis)    │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (RefreshToken table)

```sql
CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,   -- SHA-256 of the opaque token
  device_id     TEXT,                   -- client-generated stable device ID
  user_agent    TEXT,
  ip_address    INET,
  family_id     UUID NOT NULL,          -- all rotations of one login share family_id
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  revoke_reason TEXT
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
```

### Security Measures

| Threat                    | Control                                                        |
|---------------------------|----------------------------------------------------------------|
| Token theft               | Short (15 min) access token TTL                                |
| Refresh token theft       | Rotation + reuse detection (revoke entire family)              |
| Credential stuffing       | Rate limiting (10 req/15 min per IP on /auth endpoints)        |
| Password enumeration      | Constant-time comparison via argon2 (no timing side-channels)  |
| CSRF                      | httpOnly + SameSite=Strict cookies for refresh token           |
| XSS → token theft         | Access token in memory only (not localStorage), short TTL      |
| Weak passwords            | Min 10 chars, 1 upper, 1 lower, 1 digit, 1 special            |

### Password Hashing

```
Algorithm:  argon2id
memoryCost: 65536  (64 MB)
timeCost:   3
parallelism: 4
```

argon2id is chosen over bcrypt/scrypt because it provides both memory hardness (against
GPU attacks) and side-channel resistance.

### Phase 1 Exclusions

- **No social login** (Google, Apple, GitHub) — added in Phase 2.
- **No MFA** — added in Phase 2.
- **No passkeys/WebAuthn** — evaluated for Phase 3.

---

## Consequences

### Positive
- Sessions are fully revocable (lost device → log out all sessions).
- No DB query on every API request (access token is self-contained).
- Device list and last-seen tracking is possible for the sessions management UI.
- Reuse detection prevents token theft going unnoticed.

### Negative / Risks
- Slightly more complex than pure JWT. **Mitigation**: AuthModule handles all token
  logic in one place.
- Refresh endpoint is a high-value attack target. **Mitigation**: rate limiting,
  reuse detection, IP logging.
- DB hit on every token refresh. **Mitigation**: Redis cache of valid token hashes
  with TTL alignment (optional Phase 2 optimization).

---

## References

- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Refresh Token Rotation – Auth0 Docs](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- [Argon2 RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)
