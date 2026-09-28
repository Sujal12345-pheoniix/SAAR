# SAAR — Part 3C AI Readiness & Forensic Inspection Report

**Date**: September 28, 2026  
**Auditor**: Principal AI Architect + Security Architect + Backend Architect  
**Status**: APPROVED FOR PART 3C IMPLEMENTATION  

---

## 1. Executive Summary

This forensic readiness assessment reviews the existing SAAR codebase to evaluate its readiness for introducing the AI Intelligence Layer (AI Gateway, Growth Companion, Context Builder, and Memory Architecture).

### Core Architectural Principle
> **AI is the interpreter and companion of SAAR's intelligence — not the source of truth for user behavior.**

Parts 3A and 3B established the deterministic foundation:
```text
Raw Activity -> Behavior Events -> Aggregations -> Signals -> Gaps -> Tradeoffs -> Scheduling -> Interventions -> Daily Growth
```
The AI layer must read this deterministic state and communicate with the user. It must never have unrestricted access to databases, Redis, or internal services, and cannot unilaterally mutate application state without explicit user confirmation.

---

## 2. Forensic Inspection Findings

| Component | Current State | Part 3C Target | Readiness |
| :--- | :--- | :--- | :--- |
| **Part 3A Intelligence** | Rolling features (7d, 14d, 30d), Consistency, Momentum, Balance signals, Gap Engine (Quantity, Consistency, Execution, Priority, Balance) in `packages/domain` & `GrowthEngineModule`. | Source of truth for factual grounding. Context builder queries these services. | READY |
| **Part 3B Growth Engine** | Tradeoff analysis (`analyzeTradeoff`), Schedule simulator (`simulateSchedule`), Interventions (`selectInterventions`, `evaluateInterventionOutcome`), Daily Growth Orchestrator (6 sub-services). | Authoritative plan and recommendation provider. AI explains and contextualizes; does not recalculate. | READY |
| **Existing AI Code** | `packages/ai-core/src/index.ts` contains basic Phase 1 stub (`StubAiProvider`, `AiRequest`, `AiResponse`, `AiAction`). | Robust provider abstraction (`generate`, `stream`, `embed`, `moderate`), Model Router, Context Engine, Output Schemas, Safety Filters. | UPGRADE NEEDED |
| **Environment Variables** | `AI_PROVIDER_API_KEY` and `AI_PROVIDER_BASE_URL` declared in `env.validation.ts` and `.env.example`. | Add default/fallback model settings, rate limit thresholds. Secrets stay strictly backend-only. | READY |
| **Conversation Model** | `Conversation` table migrated in Prisma schema with `id`, `userId`, `title`, timestamps, index on `[userId, updatedAt]`. | Backs Companion conversations. Enforce strict user isolation. | READY |
| **Message Model** | `Message` table migrated in Prisma schema with `id`, `conversationId`, `role`, `content`, `model`, `promptVersion`, `tokenUsage`, `latencyMs`, timestamps. | Captures conversation turns with observability metadata (tokens, latency, prompt version). | READY |
| **Memory Model** | `Memory` table migrated in Prisma schema with `id`, `userId`, `type`, `summary`, `sourceRefs` (JSONB), `status` (ACTIVE/REVOKED/EXPIRED), `confidence`, `sensitivity`, `lastValidatedAt`, `userVisible`, `userEditable`, `consentedAt`, `expiresAt`. | 3-tier memory engine (Short-term, Working, Long-term) with policy enforcement and user CRUD. | READY |
| **Security & Auth** | JWT authentication via `JwtAuthGuard`, `@CurrentUser()`, user-scoped database queries. | All AI endpoints and tool calls enforce authentication, authorization, ownership, and write confirmation. | READY |
| **API Architecture** | NestJS modular monolith with Throttler, Global ValidationPipe, RequestIdInterceptor. | Add `CompanionModule` and `MemoryModule` with REST controllers, streaming SSE, and rate limits. | READY |
| **Worker Architecture** | BullMQ workers running in `apps/worker` for outbox events, intervention evaluations, aggregations. | Memory maintenance and background summarization jobs supported. | READY |

---

## 3. Detailed Component Review

### 3.1 Data Model Verification (`prisma/schema.prisma`)
The database schema already includes the necessary tables:
- `Conversation`: Cascades on `User` deletion. Indexed by `[userId, updatedAt]`.
- `Message`: Cascades on `Conversation` deletion. Indexed by `[conversationId, createdAt]`.
- `Memory`: Cascades on `User` deletion. Indexed by `[userId, type, status]`. Supports sensitivity levels (`NORMAL`, `SENSITIVE`), confidence score, consent timestamps, and source tracking.

### 3.2 Provider Abstraction & Secrets Isolation
- No client-facing apps (`apps/web`, `apps/mobile`) contain or need AI provider credentials.
- Backend (`apps/api`) acts as the single gateway for all AI interactions.
- An extensible provider interface (`AiProvider`) will support a configurable Mock/Testing adapter, Fallback adapter, and live HTTP LLM adapter.

### 3.3 Evidence-Grounded Output Schema
Output schemas must enforce distinction between:
1. **Observed Fact**: Verifiable behavior logged in the database.
2. **Derived Signal**: Statistical trend or score calculated by Part 3A.
3. **Gap / Tension**: Deterministic gap flagged by Part 3A / 3B.
4. **Hypothesis**: AI-generated interpretation clearly tagged as a possibility.
5. **Suggestion / Experiment**: Proposed micro-action or reflection.
6. **Action Proposals**: Typed domain operations requiring explicit user confirmation.

### 3.4 Tool System & Authorization Boundary
The AI will NOT execute raw SQL, filesystem operations, or internal API mutations directly.
Typed tools will be exposed via a strictly controlled dispatcher:
- **READ Tools**: `get_user_goals`, `get_recent_behavior`, `get_daily_growth`, `get_growth_gaps`, `get_schedule`. (Executed within user scope).
- **WRITE Tools**: `create_task`, `propose_schedule_change`, `create_reflection`. (Returns a confirmation request token; only executes upon user acceptance).

### 3.5 Safety & Mental Health Boundaries
- Strict detection for self-harm, medical emergencies, crisis situations, or illegal activities.
- Deterministic safety fallback responding with verified emergency resources (e.g., 988 Suicide & Crisis Lifeline, international emergency references).
- Firm non-clinical boundary: The Companion explicitly disclaims medical/therapeutic capability.

---

## 4. Part 3C Implementation Strategy

1. **Architecture Documentation**: Write complete documentation under `docs/ai/` and `docs/security/ai-threat-model.md`.
2. **AI Core Expansion (`packages/ai-core`)**:
   - Provider interface + Mock/HTTP adapters + Fallback mechanism.
   - Model router (reflection, structured summary, deep analysis, high risk).
   - Context builder with strict token budgeting and section compaction.
   - Prompt templates with versioning and prompt injection defense.
   - Output validation schemas.
   - Safety classifier and crisis interceptor.
3. **API Implementation (`apps/api`)**:
   - `CompanionModule`: REST controller, SSE streaming endpoint, conversation management, tool execution with confirmation gating.
   - `MemoryModule`: REST controller for user memory inspection, editing, and deletion.
   - Integration with domain services (`DailyGrowth`, `GrowthEngine`, `Tasks`, `Goals`, `Schedule`).
4. **Automated Verification**:
   - Unit tests covering context bounding, model routing, safety guardrails, injection defense, output validation, and memory policies.
   - End-to-end integration tests verifying chat flow, tool gating, and graceful fallback.
5. **Golden Gate Review & Report**:
   - Compile `docs/audit/PART_3C_COMPLETION_REPORT.md`.
   - Verify monorepo typecheck, lint, and tests pass.
