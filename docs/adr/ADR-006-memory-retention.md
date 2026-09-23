# ADR-006: Memory Retention & User Control

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead, Privacy Review          |

---

## Context

SAAR's AI coach learns about the user over time to provide personalized advice.
This requires persisting information between sessions — commonly called "memory."

Two broad approaches exist:

| Approach                    | Description                                           | Privacy Risk             |
|-----------------------------|-------------------------------------------------------|--------------------------|
| **Raw conversation dump**   | Store all chat history, inject as context             | High — stores everything |
| **Typed memory facts**      | Extract structured facts from interactions, store selectively | Low — intentional facts only |

Storing raw chat history creates several problems:
- Unbounded storage growth (every message forever)
- Sensitive information captured accidentally (medical details, relationship problems)
- GDPR/privacy compliance is difficult (what exactly was stored? can we delete it?)
- AI context windows filled with low-value repetition
- User trust: "Does the app remember everything I say?"

---

## Decision

**Memory is stored as compact, typed fact records — not raw chat dumps. Each memory
record requires an explicit consent status. Users can view, edit, and revoke any
memory at any time. Each memory type has a defined expiry rule.**

### Memory Schema

```sql
CREATE TABLE memory_facts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type     TEXT NOT NULL,    -- see types below
  key             TEXT NOT NULL,    -- e.g. 'preferred_wake_time'
  value           JSONB NOT NULL,   -- the fact value (typed)
  source_event    TEXT,             -- what interaction created this memory
  source_entity   TEXT,             -- e.g. 'Checkin:uuid'
  consent_status  TEXT NOT NULL DEFAULT 'IMPLICIT',  -- IMPLICIT | EXPLICIT | REVOKED
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,      -- NULL = no expiry (user preference)
  revoked_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX idx_memory_facts_user_key ON memory_facts(user_id, key)
  WHERE is_active = TRUE;
CREATE INDEX idx_memory_facts_user_type ON memory_facts(user_id, memory_type)
  WHERE is_active = TRUE;
```

### Memory Types & Expiry Rules

| memory_type            | Description                                    | Default Expiry      | Consent Required |
|------------------------|------------------------------------------------|---------------------|------------------|
| `preference`           | User preferences (wake time, work hours)       | No expiry           | Implicit         |
| `goal_context`         | AI notes about a specific goal                 | Goal end date + 30d | Implicit         |
| `behavioral_pattern`   | Detected patterns (early morning = productive) | 90 days             | Implicit         |
| `emotional_signal`     | Mood/stress patterns                           | 30 days             | Explicit         |
| `health_signal`        | Sleep, energy patterns                         | 30 days             | Explicit         |
| `personal_note`        | Something the user explicitly told the AI      | No expiry           | Explicit         |
| `relationship_context` | Notes about named relationships                | 180 days            | Explicit         |

**Explicit consent memories** must be confirmed by the user before being stored.
The AI generates a proposed memory record, presents it to the user, and only
persists it after the user taps "Remember this."

### Memory Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│  Memory Creation                                                  │
│  Trigger: checkin submitted / coaching chat / goal created       │
│  Process: AI extracts candidate facts from interaction           │
│           → Classify memory_type                                 │
│           → If IMPLICIT type: store immediately                  │
│           → If EXPLICIT type: surface to user for confirmation   │
│             User confirms → store with consent_status=EXPLICIT   │
│             User rejects  → discard (never stored)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Memory Use (AI Context Injection)                                │
│  Before each AI call: fetch active, non-expired memories         │
│  Format as compact context block (max 500 tokens)                │
│  Prioritize: EXPLICIT > PREFERENCE > BEHAVIORAL_PATTERN          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Memory Expiry (scheduled job, runs daily at 02:00 UTC)          │
│  SELECT * FROM memory_facts WHERE expires_at < NOW()             │
│    AND is_active = TRUE                                          │
│  → SET is_active = FALSE, revoked_at = NOW()                     │
│  → Retain record for audit (hard-delete after 90 days)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  User Revocation (Memory Management UI)                           │
│  User navigates to: Settings → AI Memory → View All             │
│  Selects a memory → "Forget this"                                │
│  → SET consent_status = 'REVOKED', is_active = FALSE            │
│  → Memory excluded from future AI context immediately            │
│  → Hard-delete after 30 days (GDPR right to erasure)            │
└─────────────────────────────────────────────────────────────────┘
```

### PII Controls

- **No raw quotes** from user messages stored in memory — only extracted facts.
- **Named entities** (names of friends, doctors) are stored only in `relationship_context`
  with explicit consent.
- Memory export (GDPR data portability) returns all memory facts as JSON.
- Memory purge (account deletion) triggers cascade delete within 24 hours.

---

## Consequences

### Positive
- **Privacy by design**: minimal data capture, explicit consent for sensitive types.
- **User trust**: "Memory" feature is inspectable and controllable — not a black box.
- **GDPR compliant**: data portability and right-to-erasure are built into the schema.
- **AI quality**: curated facts produce better context than raw conversation dumps.

### Negative / Risks
- **Harder to implement** than raw conversation storage.
  **Mitigation**: memory extraction logic is AI-assisted (model extracts facts from
  text), so engineering effort is bounded.
- **Memory gaps**: if the user never confirms explicit-consent prompts, the AI has
  less context. **Mitigation**: implicit-consent facts cover 80% of useful context.
- **Extraction errors**: AI may extract incorrect facts.
  **Mitigation**: user can edit any memory in the Memory Management UI.

---

## References

- [GDPR Article 17 — Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [Privacy by Design — Ann Cavoukian](https://www.ipc.on.ca/wp-content/uploads/resources/7foundationalprinciples.pdf)
- [OpenAI Memory — design reference (not a dependency)](https://help.openai.com/en/articles/8590148-memory-in-chatgpt)
