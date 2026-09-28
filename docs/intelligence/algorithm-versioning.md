# SAAR Algorithm Versioning Registry (Part 3A)

Every behavioral metric, signal generator, and gap algorithm in SAAR is assigned an explicit, immutable version string. If formulas change, a new version is created so historical insights remain explainable.

---

## Registry

| Subsystem | Algorithm ID | Version | Description |
|---|---|---|---|
| **Feature Extraction** | `features:execution` | `v1.0.0` | Task completion, skip, reschedule ratios over 7d, 14d, 30d |
| **Consistency Signal**| `signals:consistency` | `v1.0.0` | Rolling completion variance & streak evaluation |
| **Momentum Signal** | `signals:momentum` | `v1.0.0` | Velocity comparison between current 14d and previous 14d |
| **Balance Signal** | `signals:balance` | `v1.0.0` | Life area task/routine allocation distribution & entropy |
| **Gap Engine** | `gap-engine:core` | `v1.0.0` | Multi-type gap detection (Quantity, Consistency, Execution, Timing, Priority, Balance) |
| **Confidence Scoring**| `confidence:tiered` | `v1.0.0` | Sample size & stability thresholds (`NO_DATA` to `ESTABLISHED_SIGNAL`) |
