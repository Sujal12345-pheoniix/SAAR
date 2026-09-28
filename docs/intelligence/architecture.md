# SAAR Growth Intelligence Architecture (Part 3A)

## 1. Overview & Core Mission

SAAR's Growth Intelligence platform is a deterministic, explainable pipeline designed to transform raw event streams into trustworthy growth findings without hallucination, arbitrary scoring, or black-box estimation.

```text
                    USER ACTION
                         │
                         ▼
                 Behavior Event
                         │
                         ▼
                Event Validation
                         │
                         ▼
              Behavior Aggregator
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       Daily Features          Weekly Features
             │                       │
             └───────────┬───────────┘
                         ▼
                  Signal Engine
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          Consistency  Momentum   Balance
              │          │          │
              └──────────┼──────────┘
                         ▼
                   Gap Engine
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       Goal Gap                 Life Gap
             │                       │
             └───────────┬───────────┘
                         ▼
                Structured Finding
```

---

## 2. Layer Separation

The pipeline enforces strict separation of concerns across 4 distinct semantic tiers:

1. **Facts (Raw Layer)**:
   - Verifiable, immutable historical records with UTC timestamps.
   - Example: *"7 of 10 scheduled workout tasks completed between Sept 14 and Sept 28"*.
   - Never modified retroactively.

2. **Features & Signals (Derived Layer)**:
   - Versioned, mathematically deterministic rollups over rolling time windows (7d, 14d, 30d).
   - Metrics: Task completion rate, streak, routine adherence, execution variance, rescheduling frequency.
   - Signals: Directional indicators (Consistency: `DECLINING`, Momentum: `ACCELERATING`, Balance: `SKEWED`).

3. **Gaps (Evaluative Layer)**:
   - Comparison of desired intent (Stated Goals, Desired States in Future Self) against observed behavioral features.
   - Gap Types: Quantity, Consistency, Execution, Timing, Priority, Balance.
   - Every gap is qualified with a confidence tier (`NO_DATA`, `INSUFFICIENT_DATA`, `EMERGING_SIGNAL`, `ESTABLISHED_SIGNAL`).

4. **Findings & Explanations (Presentation Layer)**:
   - Explainable summaries that always attach concrete factual evidence items.
   - No ad-hominem judgments (e.g. "you are lazy"); only objective behavioral patterns.

---

## 3. Data Processing Modes

- **Synchronous Compute-on-Demand**: Lightweight feature calculation for today's dashboard (`GET /api/v1/growth/summary`).
- **Asynchronous Aggregation Worker**: `@saar/worker` executes scheduled/outbox-triggered feature rollups, computing daily and weekly snapshots and storing high-level findings in PostgreSQL.
