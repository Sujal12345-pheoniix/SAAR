# SAAR Confidence & Minimum Data Threshold Model (v1.0)

SAAR will **never fabricate confidence or generate conclusions without sufficient data**. When sample sizes are inadequate, the system explicitly reports `INSUFFICIENT_DATA` rather than guessing.

---

## 1. Confidence Tiers

| Tier | Code | Criteria | Action Permitted |
|---|---|---|---|
| **0** | `NO_DATA` | 0 events / observations recorded in window | Inform user to begin tracking |
| **1** | `INSUFFICIENT_DATA` | 1–2 observations in window | State: *"Need more data before identifying patterns"* |
| **2** | `EMERGING_SIGNAL` | 3–6 observations; consistent directional tendency | Highlight as emerging trend / tentative observation |
| **3** | `ESTABLISHED_SIGNAL` | $\ge 7$ observations spanning $\ge 2$ weeks | Formal gap analysis; eligible for interventions |

---

## 2. Threshold Matrix by Metric

| Domain | Feature / Signal | Insufficient (<) | Emerging | Established (>=) |
|---|---|---|---|---|
| **Task Completion** | `task_completion_rate_7d` | < 3 planned | 3 – 6 planned | 7+ planned |
| **Task Consistency** | `task_completion_rate_14d` | < 5 planned | 5 – 11 planned | 12+ planned |
| **Routine Adherence** | `routine_adherence_14d` | < 4 expected | 4 – 9 expected | 10+ expected |
| **Goal Progress** | `goal_velocity_30d` | < 3 metric obs | 3 – 5 metric obs | 6+ metric obs |
| **Well-being** | `avg_mood_7d` | < 3 check-ins | 3 – 4 check-ins | 5+ check-ins |
| **Life Area Balance** | `balance_distribution_14d` | < 6 total tasks | 6 – 13 total tasks | 14+ total tasks |

---

## 3. Confidence Calculation Formula

Given an observation count $N$ against baseline established target $N_{\text{est}}$ and signal stability variance $\sigma^2$:

$$\text{Confidence Score} = \min\left(1.0, \frac{N}{N_{\text{est}}}\right) \times (1 - \min(0.5, \sigma_{\text{norm}}))$$
