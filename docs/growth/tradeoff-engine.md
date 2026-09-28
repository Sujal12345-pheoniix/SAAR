# SAAR Growth Engine: Life Trade-off Architecture & Model

**Module**: Life Trade-off Engine  
**Version**: `1.0.0`  
**Classification**: Pure Deterministic Domain Engine  

---

## 1. Core Philosophy

Personal growth systems traditionally fail because they implicitly assume an infinite resource model:
> "Just wake up earlier, meditate for 30 minutes, study for 2 hours, run 10k, spend quality family time, and work 10 hours."

In the real world, human capacity is bounded by **finite, competing resources**:
- **Time**: Fixed 24-hour budget ($1440$ minutes).
- **Schedule Capacity**: Usable discretionary minutes after sleep, routines, meals, and committments.
- **Energy & Cognitive Load**: Diminishing focus across high-demand tasks.
- **Recovery / Sleep**: Non-negotiable biological maintenance.
- **Cross-Life-Area Tension**: Optimizing for Career frequently borrows capacity from Health or Relationships.

The **SAAR Life Trade-off Engine** models these realities explicitly. Instead of encouraging users to "do more", it calculates the real price of every proposed action and surfaces trade-offs clearly.

---

## 2. Structured Trade-off Model

Every candidate action is evaluated through the following relational schema:

```text
Candidate Action (e.g. "Add 60 min Deep Work")
       │
       ├── Required Duration: 60 mins
       ├── Life Area: "career"
       ├── Expected Benefit: +18% weekly progress on Goal "System Design"
       │
       ├── Resource Footprint:
       │     ├── Energy Level: HIGH
       │     ├── Schedule Slot: 21:00 - 22:00
       │
       ├── Potential Costs:
       │     ├── Sleep Routine: Pushes bedtime back by 45 mins
       │     ├── Recovery Score: Reduces recovery buffer below 30 min minimum
       │     ├── Tension Area: "health" (-12% consistency probability)
       │
       ├── Conflicts Identified:
       │     └── Overlap with "Evening Wind-down Routine"
       │
       └── Confidence Score: ESTABLISHED_SIGNAL (based on 30-day bedtime variance)
```

### TypeScript Data Representation

```typescript
export interface CandidateAction {
  id: string;
  title: string;
  actionType: 'ADD_TASK' | 'SCHEDULE_ROUTINE' | 'EXTEND_DURATION' | 'INCREASE_FREQUENCY';
  lifeAreaId?: string;
  lifeAreaType: LifeAreaType;
  goalId?: string;
  estimatedMinutes: number;
  energyDemand: 'LOW' | 'MEDIUM' | 'HIGH';
  preferredTimeWindow?: { startHour: number; endHour: number };
}

export interface ResourceBudget {
  totalDailyMinutes: number; // typically 1440
  sleepMinutes: number; // e.g. 480
  fixedCommitmentMinutes: number; // e.g. 480 (work/school)
  scheduledRoutineMinutes: number; // e.g. 90
  plannedTaskMinutes: number; // existing tasks in plan
  bufferReserveMinutes: number; // minimum rest/transition (default 60)
}

export interface TradeoffAnalysis {
  actionId: string;
  feasible: boolean;
  availableCapacityMinutes: number;
  netCapacityAfterAction: number;
  expectedBenefits: TradeoffBenefit[];
  potentialCosts: TradeoffCost[];
  conflicts: TradeoffConflict[];
  recommendation: 'PROCEED' | 'WARN_TRADE_OFF' | 'REJECT_OVERLOAD';
  summary: string;
}
```

---

## 3. Capacity & Constraint Equations

Let $C_{total}$ be total daily minutes ($1440$).
The available discretionary capacity $C_{avail}$ is defined as:

$$C_{avail} = C_{total} - \left( C_{sleep} + C_{fixed} + C_{routines} + C_{tasks} + C_{buffer} \right)$$

Where:
- $C_{sleep}$: Target or observed average sleep duration.
- $C_{fixed}$: Static non-negotiable obligations.
- $C_{routines}$: Sum of expected durations for active scheduled routines.
- $C_{tasks}$: Sum of estimated durations of existing planned tasks.
- $C_{buffer}$: Dynamic transition buffer ($\ge 15$ mins per task switch).

### Overload Rule
If $\text{netCapacity} < 0$:
The action is classified as **REJECT_OVERLOAD**. The system refuses to suggest adding tasks without suggesting an equivalent displacement or scope reduction.

---

## 4. Conflict Classification

| Conflict Level | Condition | Explanation |
|---|---|---|
| **HARD_TIME_COLLISION** | Two scheduled activities share identical clock time | Physical impossibility to execute both simultaneously. |
| **BUFFER_VIOLATION** | Gap between consecutive high-intensity activities $< 15$ mins | High risk of friction, spillover, or cognitive burnout. |
| **RECOVERY_INCURSION** | Action occupies user's established sleep / wind-down window | Sacrificing recovery for productivity leads to negative momentum within 72 hours. |
| **ASYMMETRIC_SKEW** | Action increases dominant life area beyond 75% weekly allocation | Exacerbates lifestyle imbalance. |

---

## 5. Explainability Contract

The trade-off engine never issues emotional or judgmental warnings.
All feedback follows the **Evidence-Cost-Choice** paradigm:
- *"Adding 'Leetcode Practice (60m)' at 21:30 will leave 15 minutes before your established 22:30 sleep window."*
- *"Trade-off: Prioritizing 'Career' tonight reduces your 'Health' recovery buffer by 45 minutes."*
- *"Option: Shift session to 18:30 or reduce scope to 30 minutes."*
