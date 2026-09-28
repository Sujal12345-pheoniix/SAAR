# SAAR Daily Growth Session: Structured Orchestration Specification

**Module**: Daily Growth Orchestrator  
**Version**: `1.0.0`  
**Classification**: Deterministic Multi-Step Session Orchestrator  

---

## 1. Executive Overview

The **Daily Growth Session** is the core recurring ritual of the SAAR platform. It transforms passive habit tracking into an active, reflective, adaptive dialogue between the user and their behavioral reality.

### Non-Negotiable Invariants:
1. **Not a Free-Form Chatbot**: The session is strictly driven by an underlying deterministic state machine. Even when narrated by AI in Part 4, every question, insight, and schedule recommendation must correspond to verifiable facts in the session state object.
2. **Deterministic & Idempotent**: Requesting the daily growth state for a given calendar date returns identical structured findings unless underlying database facts change. Multiple invocations never create duplicate sessions or conflicting plans.
3. **8-Step Analytical Sequence**:
   1. *What happened?* (Today's check-in: mood, energy, day rating).
   2. *What did you plan?* (Tasks scheduled on active plan).
   3. *What actually happened?* (Completions, skips, reschedules, actual duration).
   4. *What changed?* (Schedule disruptions, drift from morning intent).
   5. *What patterns are visible?* (7d/14d momentum, consistency streaks, life area distribution).
   6. *Where is the meaningful gap?* (Detected gaps against goals and Future Self).
   7. *What intervention is available?* (Concrete candidate interventions to resolve friction).
   8. *What should tomorrow look like?* (Candidate tasks, trade-off simulation, proposed plan).

---

## 2. Orchestrator Architecture

Rather than an unmaintainable monolith, the Daily Growth system is structured as an orchestrator coordinating five specialized domain services:

```text
               DailyGrowthOrchestrator
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
DailyStateBuilder  ExecutionAnalyzer   GapAnalyzer
      ▲                  ▲                  ▲
      └──────────────────┼──────────────────┘
                         │
      ┌──────────────────┴──────────────────┐
      ▼                                     ▼
TradeoffAnalyzer                       InterventionSelector & TomorrowPlanner
```

### Component Responsibilities:
- **`DailyStateBuilder`**: Fetches user timezone, active goals, FutureSelf, checkins, routines, and plan for the targeted local date.
- **`ExecutionAnalyzer`**: Calculates planned vs actual execution statistics, friction scores, and duration accuracy.
- **`GapAnalyzer`**: Pulls rolling multi-window features and evaluates deterministic gap findings.
- **`TradeoffAnalyzer`**: Evaluates resource budgets (sleep, commitments, tasks, buffer) for tomorrow.
- **`InterventionSelector`**: Matches detected gaps to actionable intervention candidates.
- **`TomorrowPlanner`**: Scores candidate tasks for tomorrow, identifies potential conflicts, and compiles a simulation preview.

---

## 3. Canonical Daily Growth State Schema

```typescript
export interface DailyGrowthSessionState {
  date: string; // YYYY-MM-DD local calendar date
  userId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
  
  checkin: {
    completed: boolean;
    mood: number | null;
    energy: number | null;
    reflection: string | null;
    dayRating: number | null;
  };

  execution: {
    plannedTasksCount: number;
    completedTasksCount: number;
    skippedTasksCount: number;
    rescheduledTasksCount: number;
    completionRate: number;
    frictionScore: number;
    totalMinutesInvested: number;
  };

  signals: GrowthSignal[];
  gaps: GapFinding[];
  tradeoffs: TradeoffAnalysis[];
  interventions: InterventionCandidate[];

  tomorrowPlanPreview: {
    targetDate: string;
    capacityMinutes: number;
    allocatedMinutes: number;
    candidateTasks: Array<{
      taskId: string;
      title: string;
      goalTitle?: string;
      priority: number;
      estimatedMinutes: number;
      rankingScore: number;
      selectionReason: string;
    }>;
    conflicts: string[];
    feasibilityScore: number;
  };

  engineVersion: string;
}
```

---

## 4. Idempotency & Lifecycle Endpoints

- `GET /api/v1/daily-growth/today`: Fetches or compiles the state object for the user's current local calendar date.
- `GET /api/v1/daily-growth/:date`: Historical inspection of the session state for any valid past date.
- `POST /api/v1/daily-growth/:date/start`: Idempotently marks session started (`daily_growth.started` outbox event).
- `POST /api/v1/daily-growth/:date/complete`: Idempotently marks session completed (`daily_growth.completed` outbox event) and finalizes tomorrow's proposed plan if accepted.
