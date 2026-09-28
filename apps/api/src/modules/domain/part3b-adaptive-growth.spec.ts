import {
  analyzeTradeoff,
  calculateScheduleCapacity,
  scoreCandidate,
  rankCandidates,
  simulateSchedule,
  selectInterventions,
  evaluateInterventionOutcome,
  calculateDailyExecutionSummary,
  compileTomorrowPlanPreview,
  type CandidateAction,
  type ResourceBudget,
  type ScheduleCandidate,
  type InterventionCandidate,
  type ExecutionFeatures,
  type RoutineFeatures,
  type LifeAreaFeatures,
} from '@saar/domain';

describe('SAAR Part 3B — Adaptive Growth Engine Unit Tests', () => {
  describe('1. Life Trade-off Engine', () => {
    const baseBudget: ResourceBudget = {
      totalDailyMinutes: 1440,
      sleepMinutes: 480, // 8h
      fixedCommitmentMinutes: 480, // 8h work
      scheduledRoutineMinutes: 60,
      plannedTaskMinutes: 240, // 4h
      bufferReserveMinutes: 60,
    };

    it('calculates available capacity and allows feasible actions', () => {
      // 1440 - (480 + 480 + 60 + 240 + 60) = 120 discretionary minutes
      const action: CandidateAction = {
        id: 'act-1',
        title: 'Evening Reading',
        actionType: 'ADD_TASK',
        lifeAreaType: 'mind',
        estimatedMinutes: 45,
        energyDemand: 'LOW',
        preferredTimeWindow: { startHour: 19, endHour: 20 },
      };

      const result = analyzeTradeoff(action, baseBudget);

      expect(result.feasible).toBe(true);
      expect(result.availableCapacityMinutes).toBe(120);
      expect(result.netCapacityAfterAction).toBe(75);
      expect(result.recommendation).toBe('PROCEED');
      expect(result.conflicts).toHaveLength(0);
    });

    it('flags CAPACITY_OVERFLOW and rejects overload when action exceeds available minutes', () => {
      const action: CandidateAction = {
        id: 'act-heavy',
        title: 'Deep Work Sprint',
        actionType: 'ADD_TASK',
        lifeAreaType: 'career',
        estimatedMinutes: 180, // 180 > 120
        energyDemand: 'HIGH',
      };

      const result = analyzeTradeoff(action, baseBudget);

      expect(result.feasible).toBe(false);
      expect(result.recommendation).toBe('REJECT_OVERLOAD');
      expect(result.conflicts.some((c) => c.type === 'CAPACITY_OVERFLOW')).toBe(true);
      expect(result.conflicts[0]?.severity).toBe('CRITICAL');
    });

    it('flags RECOVERY_INCURSION when action intrudes into sleep hours (22:00-06:00)', () => {
      const action: CandidateAction = {
        id: 'act-late',
        title: 'Late Night Coding',
        actionType: 'ADD_TASK',
        lifeAreaType: 'career',
        estimatedMinutes: 60,
        energyDemand: 'HIGH',
        preferredTimeWindow: { startHour: 23, endHour: 24 }, // encroaches into sleep!
      };

      const result = analyzeTradeoff(action, baseBudget);

      expect(result.feasible).toBe(false);
      expect(result.recommendation).toBe('REJECT_OVERLOAD');
      expect(result.conflicts.some((c) => c.type === 'RECOVERY_INCURSION')).toBe(true);
    });

    it('warns about ASYMMETRIC_SKEW when action adds to an already dominant life area', () => {
      const skewedLifeAreas: LifeAreaFeatures = {
        name: 'life_area_features',
        version: '1.0.0',
        windowDays: 14,
        sampleSize: 20,
        confidence: 'ESTABLISHED_SIGNAL',
        calculatedAt: new Date().toISOString(),
        topAreaType: 'career',
        entropyScore: 0.45,
        distributions: [
          { areaId: 'la-1', areaType: 'career', title: 'Career', completedTasksCount: 16, completedRoutinesCount: 0, totalActivitiesCount: 16, allocationPercentage: 80 },
          { areaId: 'la-2', areaType: 'health', title: 'Health', completedTasksCount: 4, completedRoutinesCount: 0, totalActivitiesCount: 4, allocationPercentage: 20 },
        ],
      };

      const action: CandidateAction = {
        id: 'act-career-more',
        title: 'Another Work Project',
        actionType: 'ADD_TASK',
        lifeAreaType: 'career',
        estimatedMinutes: 30,
        energyDemand: 'MEDIUM',
        preferredTimeWindow: { startHour: 14, endHour: 15 },
      };

      const result = analyzeTradeoff(action, baseBudget, skewedLifeAreas);

      expect(result.feasible).toBe(true);
      expect(result.recommendation).toBe('WARN_TRADE_OFF');
      expect(result.conflicts.some((c) => c.type === 'ASYMMETRIC_SKEW')).toBe(true);
    });
  });

  describe('2. Schedule Capacity Model', () => {
    it('accurately budgets daily minutes and transition buffers', () => {
      const tasks = [
        { id: 't-1', estimatedMinutes: 60 },
        { id: 't-2', estimatedMinutes: 45 },
      ];
      const routines = [{ id: 'r-1', expectedDurationMinutes: 30 }];

      // 1440 - (480 sleep + 480 work + 30 routine + 105 tasks + (3 items * 15m buffer = 45m)) = 300
      const cap = calculateScheduleCapacity(tasks, routines, 480, 480, 15);

      expect(cap.plannedTaskMinutes).toBe(105);
      expect(cap.scheduledRoutineMinutes).toBe(30);
      expect(cap.transitionBufferMinutes).toBe(45);
      expect(cap.usableDiscretionaryMinutes).toBe(300);
    });
  });

  describe('3. Multi-Factor Candidate Ranking Algorithm', () => {
    const context = {
      targetDate: '2026-09-28',
      targetWindow: 'MORNING' as const,
      lifeAreaFeatures: {
        name: 'life_area_features' as const,
        version: '1.0.0',
        windowDays: 14,
        sampleSize: 10,
        confidence: 'ESTABLISHED_SIGNAL' as const,
        calculatedAt: new Date().toISOString(),
        topAreaType: 'career',
        entropyScore: 0.5,
        distributions: [
          { areaId: 'la-1', areaType: 'career', title: 'Career', completedTasksCount: 8, completedRoutinesCount: 0, totalActivitiesCount: 8, allocationPercentage: 80 },
          { areaId: 'la-2', areaType: 'health', title: 'Health', completedTasksCount: 2, completedRoutinesCount: 0, totalActivitiesCount: 2, allocationPercentage: 20 },
        ],
      },
    };

    it('prioritizes urgent, high-goal-priority, time-compatible tasks', () => {
      const candidateHigh: ScheduleCandidate = {
        id: 'c-high',
        title: 'Priority 1 Marathon Run',
        goalPriority: 1,
        lifeAreaType: 'health',
        dueAt: '2026-09-28T09:00:00Z',
        estimatedMinutes: 45,
        rescheduleCount: 0,
        historicalWindowCompletionRates: { MORNING: 90 },
      };

      const candidateLow: ScheduleCandidate = {
        id: 'c-low',
        title: 'Someday Low Priority Task',
        goalPriority: 5,
        lifeAreaType: 'career',
        estimatedMinutes: 60,
        rescheduleCount: 3,
        historicalWindowCompletionRates: { MORNING: 20 },
      };

      const scoreHigh = scoreCandidate(candidateHigh, context);
      const scoreLow = scoreCandidate(candidateLow, context);

      expect(scoreHigh.finalScore).toBeGreaterThan(scoreLow.finalScore);
      expect(scoreHigh.goalRelevance).toBe(1.0);
      expect(scoreHigh.urgency).toBe(1.0);
      expect(scoreHigh.timeCompatibility).toBe(0.9);
      expect(scoreHigh.balanceBonus).toBe(0.6); // Health is underrepresented
      expect(scoreHigh.explanation).toContain('Priority 1 goal alignment');

      expect(scoreLow.frictionPenalty).toBeLessThan(0.5);
      expect(scoreLow.explanation).toContain('Penalized for 3 prior reschedules');
    });

    it('ranks candidate list in descending score order', () => {
      const candidates: ScheduleCandidate[] = [
        { id: '1', title: 'Low', goalPriority: 4, lifeAreaType: 'career', estimatedMinutes: 30, rescheduleCount: 2 },
        { id: '2', title: 'Urgent', goalPriority: 1, lifeAreaType: 'health', dueAt: '2026-09-28', estimatedMinutes: 30, rescheduleCount: 0 },
      ];

      const ranked = rankCandidates(candidates, context);
      expect(ranked[0]?.candidate.id).toBe('2');
      expect(ranked[1]?.candidate.id).toBe('1');
    });
  });

  describe('4. Schedule Simulation Engine', () => {
    it('computes schedule diff and feasibility without mutating active state', () => {
      const currentTasks = [
        { id: 't-1', title: 'Morning Workout', scheduledAt: '2026-09-28T07:00:00Z', estimatedMinutes: 45 },
        { id: 't-2', title: 'Write Architecture Spec', scheduledAt: '2026-09-28T10:00:00Z', estimatedMinutes: 120 },
      ];

      const proposedTasks = [
        // Shift workout to evening
        { id: 't-1', title: 'Morning Workout', scheduledAt: '2026-09-28T18:00:00Z', estimatedMinutes: 45, action: 'MOVE' as const },
        // Keep architecture spec
        { id: 't-2', title: 'Write Architecture Spec', scheduledAt: '2026-09-28T10:00:00Z', estimatedMinutes: 120, action: 'KEEP' as const },
        // Add meditation
        { id: 't-3', title: '10m Meditation', scheduledAt: '2026-09-28T07:00:00Z', estimatedMinutes: 10, action: 'ADD' as const },
      ];

      const sim = simulateSchedule(1, currentTasks, proposedTasks, 300);

      expect(sim.currentPlanVersion).toBe(1);
      expect(sim.proposedPlanVersion).toBe(2);
      expect(sim.diff.tasksMoved).toHaveLength(1);
      expect(sim.diff.tasksMoved[0]?.taskId).toBe('t-1');
      expect(sim.diff.tasksAdded).toHaveLength(1);
      expect(sim.diff.tasksAdded[0]?.taskId).toBe('t-3');
      expect(sim.feasibilityScore).toBe(100);
      expect(sim.summary).toContain('1 added, 1 moved');
    });
  });

  describe('5. Canonical Adaptation Rules & Intervention Selection', () => {
    it('selects SPLIT_TASK (Rule ADAPT-001) for monolithic rescheduled tasks', () => {
      const baseExecution: ExecutionFeatures = {
        name: 'execution_features',
        version: '1.0.0',
        windowDays: 7,
        sampleSize: 10,
        confidence: 'ESTABLISHED_SIGNAL',
        calculatedAt: new Date().toISOString(),
        tasksPlanned: 10,
        tasksCompleted: 6,
        tasksSkipped: 2,
        tasksRescheduled: 2,
        completionRate: 60,
        skipRate: 20,
        rescheduleRate: 20,
        actualDurationTotalMinutes: 300,
      };

      const baseRoutine: RoutineFeatures = {
        name: 'routine_features',
        version: '1.0.0',
        windowDays: 7,
        sampleSize: 7,
        confidence: 'ESTABLISHED_SIGNAL',
        calculatedAt: new Date().toISOString(),
        expectedOccurrences: 7,
        completedOccurrences: 6,
        skippedOccurrences: 1,
        missedOccurrences: 0,
        adherenceRate: 85,
      };

      const tasksWithFriction = [
        { id: 't-monolith', title: 'Build Compiler AST Parser', rescheduleCount: 3, estimatedMinutes: 120 },
      ];

      const interventions = selectInterventions({
        userId: 'u-1',
        gaps: [],
        execution7d: baseExecution,
        routine7d: baseRoutine,
        tasksWithFriction,
      });

      const splitInt = interventions.find((i) => i.actionType === 'SPLIT_TASK');
      expect(splitInt).toBeDefined();
      expect(splitInt?.title).toContain('Build Compiler AST Parser');
      expect(splitInt?.confidence).toBe('ESTABLISHED_SIGNAL');
      expect(splitInt?.measurementWindowDays).toBe(7);
    });

    it('selects REDUCE_SCOPE (Rule ADAPT-003) on chronic over-planning', () => {
      const overplanningExec: ExecutionFeatures = {
        name: 'execution_features',
        version: '1.0.0',
        windowDays: 7,
        sampleSize: 14,
        confidence: 'ESTABLISHED_SIGNAL',
        calculatedAt: new Date().toISOString(),
        tasksPlanned: 6, // >= 5
        tasksCompleted: 2,
        tasksSkipped: 2,
        tasksRescheduled: 2,
        completionRate: 33, // < 50%
        skipRate: 33,
        rescheduleRate: 33, // frictionRate = 66% >= 40%
        actualDurationTotalMinutes: 120,
      };

      const interventions = selectInterventions({
        userId: 'u-1',
        gaps: [],
        execution7d: overplanningExec,
        routine7d: {
          name: 'routine_features',
          version: '1.0.0',
          windowDays: 7,
          sampleSize: 7,
          confidence: 'ESTABLISHED_SIGNAL',
          calculatedAt: new Date().toISOString(),
          expectedOccurrences: 7,
          completedOccurrences: 7,
          skippedOccurrences: 0,
          missedOccurrences: 0,
          adherenceRate: 100,
        },
      });

      const reduceInt = interventions.find((i) => i.actionType === 'REDUCE_SCOPE');
      expect(reduceInt).toBeDefined();
      expect(reduceInt?.requiredUserAction).toContain('3-task daily planning limit');
    });
  });

  describe('6. Intervention Outcome Measurement', () => {
    it('computes positive outcome delta and notes when behavior improves', () => {
      const intervention: Pick<InterventionCandidate, 'baselineMetric' | 'measurementWindowDays'> = {
        baselineMetric: {
          name: 'task_completion_rate',
          value: 35.0,
          unit: '%',
        },
        measurementWindowDays: 7,
      };

      const outcome = evaluateInterventionOutcome(intervention, 75.0);

      expect(outcome.improved).toBe(true);
      expect(outcome.baselineValue).toBe(35.0);
      expect(outcome.postValue).toBe(75.0);
      expect(outcome.outcomeDelta).toBe(40.0);
      expect(outcome.notes).toContain('achieved positive behavioral delta');
    });

    it('flags non-improvement when post-value does not surpass baseline', () => {
      const intervention: Pick<InterventionCandidate, 'baselineMetric' | 'measurementWindowDays'> = {
        baselineMetric: {
          name: 'task_completion_rate',
          value: 50.0,
          unit: '%',
        },
        measurementWindowDays: 7,
      };

      const outcome = evaluateInterventionOutcome(intervention, 45.0);

      expect(outcome.improved).toBe(false);
      expect(outcome.outcomeDelta).toBe(-5.0);
      expect(outcome.notes).toContain('did not yield improvement');
    });
  });

  describe('7. Daily Growth Pure Calculations', () => {
    it('computes daily execution summary including completion rate and friction score', () => {
      const tasks = [
        { id: '1', status: 'COMPLETED', actualDurationMinutes: 30 },
        { id: '2', status: 'COMPLETED', actualDurationMinutes: 45 },
        { id: '3', status: 'SKIPPED' },
        { id: '4', status: 'RESCHEDULED', rescheduleCount: 1 },
      ];

      const summary = calculateDailyExecutionSummary(tasks);

      expect(summary.plannedTasksCount).toBe(4);
      expect(summary.completedTasksCount).toBe(2);
      expect(summary.completionRate).toBe(50); // 2/4 = 50%
      expect(summary.frictionScore).toBe(50); // 2/4 = 50%
      expect(summary.totalMinutesInvested).toBe(75);
    });

    it('compiles tomorrow plan preview respecting usable capacity', () => {
      const candidates = [
        {
          candidate: { id: 't-1', title: 'High Priority Task', lifeAreaType: 'career' as const, estimatedMinutes: 60, rescheduleCount: 0 },
          score: { goalRelevance: 1, urgency: 1, timeCompatibility: 1, balanceBonus: 1, frictionPenalty: 1, finalScore: 95, explanation: 'Top fit' },
        },
        {
          candidate: { id: 't-2', title: 'Secondary Task', lifeAreaType: 'health' as const, estimatedMinutes: 45, rescheduleCount: 0 },
          score: { goalRelevance: 0.8, urgency: 0.8, timeCompatibility: 0.8, balanceBonus: 0.8, frictionPenalty: 1, finalScore: 80, explanation: 'Good fit' },
        },
      ];

      const capacity = {
        totalDayMinutes: 1440,
        sleepMinutes: 480,
        fixedCommitmentMinutes: 480,
        scheduledRoutineMinutes: 60,
        plannedTaskMinutes: 0,
        transitionBufferMinutes: 60,
        usableDiscretionaryMinutes: 360,
      };

      const plan = compileTomorrowPlanPreview(candidates, capacity, '2026-09-29', 3);

      expect(plan.targetDate).toBe('2026-09-29');
      expect(plan.candidateTasks).toHaveLength(2);
      expect(plan.allocatedMinutes).toBe(105);
      expect(plan.feasibilityScore).toBeGreaterThan(60);
    });
  });
});
