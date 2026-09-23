# ADR-005: AI Provider Abstraction Layer

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead                          |

---

## Context

SAAR's core value proposition is AI-powered coaching — insight generation, goal
decomposition, check-in analysis, proactive nudges, and conversational guidance.
This requires calling Large Language Model (LLM) APIs.

At the time of Phase 1, viable providers include:

| Provider        | Strengths                              | Weaknesses                              |
|-----------------|----------------------------------------|-----------------------------------------|
| OpenAI (GPT-4o) | Best instruction-following, widest use | Cost, usage cap risk, US-only data      |
| Anthropic Claude| Strong reasoning, long context window  | Slower, different API surface           |
| Google Gemini   | Multimodal, low cost at scale          | Less mature API, rate limits            |
| Local (Ollama)  | Privacy, zero cost, offline            | Slower, lower quality for complex tasks |

If domain modules call `openai.chat.completions.create(...)` **directly**, switching
providers requires touching every call site. Worse, there is no central place to:

- Enforce content policies (system prompt injection, PII stripping)
- Rate-limit AI calls per user to control costs
- Log prompts/completions for debugging (with PII redacted)
- Implement circuit-breakers when providers are degraded
- A/B test models

---

## Decision

**All LLM calls go through an internal `AiCoreModule` adapter. No domain module
imports the OpenAI SDK, Anthropic SDK, or any other LLM client library directly.**

### Interface Contract

```typescript
// packages/contracts/src/ai-core.interface.ts

export interface AiCompletionRequest {
  systemPrompt: string;
  userMessage:  string;
  context?:     AiContextBlock[];
  model?:       AiModel;        // Optional override; defaults to env config
  maxTokens?:   number;
  temperature?: number;         // 0.0–2.0
  userId:       string;         // For rate limiting and audit
  feature:      AiFeature;      // 'insight_gen' | 'goal_decompose' | 'coaching_chat' | ...
}

export interface AiCompletionResponse {
  content:      string;
  model:        string;         // actual model used
  inputTokens:  number;
  outputTokens: number;
  latencyMs:    number;
  requestId:    string;         // provider request ID for support tickets
}

export interface AiContextBlock {
  role:    'user' | 'assistant' | 'system';
  content: string;
}

export type AiModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet'
  | 'gemini-1.5-pro'
  | 'local-llama3';

export type AiFeature =
  | 'insight_gen'
  | 'goal_decompose'
  | 'coaching_chat'
  | 'checkin_analysis'
  | 'task_suggest'
  | 'notification_copy';
```

### Module Structure

```
modules/ai-core/
  ai-core.module.ts         # exports AiCoreService
  ai-core.service.ts        # routes to correct adapter, applies policies
  adapters/
    openai.adapter.ts       # wraps openai npm package
    anthropic.adapter.ts    # wraps @anthropic-ai/sdk
    gemini.adapter.ts       # wraps @google/generative-ai
    local.adapter.ts        # wraps ollama HTTP API
  policies/
    pii-redaction.policy.ts # strips emails, phone numbers from prompts
    content-safety.policy.ts# blocks prompt injection patterns
    rate-limit.policy.ts    # per-user token budget enforcement
  prompt-templates/
    insight-gen.prompt.ts
    goal-decompose.prompt.ts
    coaching-chat.prompt.ts
  ai-core.config.ts         # reads AI_PROVIDER, AI_MODEL_* from env
```

### Provider Selection Strategy

```typescript
// ai-core.config.ts — provider selected by environment variable
AI_PROVIDER=openai          # options: openai | anthropic | gemini | local
AI_MODEL_INSIGHT=gpt-4o-mini
AI_MODEL_COACHING=gpt-4o
AI_MODEL_DECOMPOSE=gpt-4o-mini
```

The `AiCoreService` selects the adapter at startup based on `AI_PROVIDER`.
Per-feature model overrides allow cost optimization (use mini for bulk tasks,
full model for coaching).

### Policy Pipeline

Every request passes through a sequential policy pipeline before hitting the provider:

```
Request
  → PiiRedactionPolicy     (strip PII from user messages)
  → ContentSafetyPolicy    (block injection patterns)
  → RateLimitPolicy        (check per-user token budget in Redis)
  → [Selected Adapter]     (call provider API)
  → ResponsePolicy         (validate output, strip any leaked PII)
  → Logging                (log redacted prompt + completion to OTEL)
Response
```

### Cost & Rate Limit Controls

```
Per-user daily token budget (free tier):   50,000 tokens/day
Per-user daily token budget (premium):    500,000 tokens/day
Global circuit-breaker:                    trip at 5 errors in 30s
Provider timeout:                          30 seconds
```

---

## Consequences

### Positive
- **Provider switching**: change `AI_PROVIDER` env var, restart — zero code changes.
- **Central policy enforcement**: PII redaction, content safety, rate limiting in one place.
- **Cost visibility**: all token usage tracked per user and feature in `ai_usage_log`.
- **Testability**: domain module tests mock `AiCoreService` — no OpenAI SDK in tests.

### Negative / Risks
- **Extra indirection**: adds one call-stack level. Latency impact is negligible
  (< 0.5 ms overhead).
- **Adapter maintenance**: each provider's API changes require updating the adapter.
  **Mitigation**: adapters are small, well-tested, isolated files.
- **Model capability differences**: `gpt-4o` and `claude-3-5-sonnet` behave
  differently for the same prompt. **Mitigation**: prompt templates are tested
  against each model before activating.

---

## References

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Anthropic API Reference](https://docs.anthropic.com/en/api/getting-started)
- [Vercel AI SDK](https://sdk.vercel.ai/docs) — considered but rejected (too opinionated for backend-only use)
- [LangChain](https://langchain.com/) — considered but rejected (heavy, unstable API surface)
