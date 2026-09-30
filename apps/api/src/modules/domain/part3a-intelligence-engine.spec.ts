import {
  isValidBehaviorEventType,
  calculateExecutionFeatures,
  calculateConsistencyFeatures,
  calculateRoutineFeatures,
  calculateWellBeingFeatures,
  calculateLifeAreaFeatures,
  calculateConsistencySignal,
  calculateMomentumSignal,
  calculateBalanceSignal,
  detectGaps,
  calculateStreak,
  getLocalDateString,
  getRecentLocalDates,
  getConfidenceTier,
  type LifeAreaDistribution,
  type GapFinding,
} from '@saar/domain';

describe('SAAR Part 3A — Growth Intelligence Foundation Unit Tests', () => {
  describe('1. Behavior Event Taxonomy Validation', () => {
    it('validates canonical event types', () => {
      expect(isValidBehaviorEventType('task.completed')).toBe(true);
      expect(isValidBehaviorEventType('task.skipped')).toBe(true);
      expect(isValidBehaviorEventType('task.rescheduled')).toBe(true);
      expect(isValidBehaviorEventType('routine.completed')).toBe(true);
      expect(isValidBehaviorEventType('goal.created')).toBe(true);
      expect(isValidBehaviorEventType('checkin.completed')).toBe(true);
      expect(isValidBehaviorEventType('daily_growth.started')).toBe(true);
    });

    it('rejects uncatalogued or malicious event types', () => {
      expect(isValidBehaviorEventType('user.hacked')).toBe(false);
      expect(isValidBehaviorEventType('custom.random_event')).toBe(false);
      expect(isValidBehaviorEventType('')).toBe(false);
    });
  });

  describe('2. Timezone-Aware Calendar & Streak Calculations', () => {
    it('determines local date string correctly across timezones', () => {
      // 2026-09-28 01:00 UTC is 2026-09-28 06:30 in Asia/Kolkata, but 2026-09-27 in America/New_York
      const instant = new Date('2026-09-28T01:00:00.000Z');
      expect(getLocalDateString(instant, 'Asia/Kolkata')).toBe('2026-09-28');
      expect(getLocalDateString(instant, 'America/New_York')).toBe('2026-09-27');
    });

    it('generates chronological local dates without skipping DST boundaries', () => {
      const dates = getRecentLocalDates(7, new Date('2026-09-28T12:00:00Z'), 'UTC');
      expect(dates).toHaveLength(7);
      expect(dates[dates.length - 1]).toBe('2026-09-28');
    });

    it('calculates continuous streak with 1-day grace period', () => {
      // Completed on Sept 28, Sept 27, skipped Sept 26 (grace day), completed Sept 25, Sept 24
      const active = ['2026-09-28', '2026-09-27', '2026-09-25', '2026-09-24'];
      const streak = calculateStreak(active, '2026-09-28', 1);
      expect(streak).toBe(4);
    });

    it('breaks streak when gap exceeds grace period', () => {
      // Gap of 2 missed days (Sept 27, Sept 26 missed)
      const active = ['2026-09-28', '2026-09-25'];
      const streak = calculateStreak(active, '2026-09-28', 1);
      expect(streak).toBe(1); // Only today's day counted
    });
  });

  describe('3. Minimum Data Thresholds & Confidence Tiers', () => {
    it('returns NO_DATA when sample size is 0', () => {
      expect(getConfidenceTier(0, 3, 7)).toBe('NO_DATA');
    });

    it('returns INSUFFICIENT_DATA when sample size is below emerging threshold', () => {
      expect(getConfidenceTier(2, 3, 7)).toBe('INSUFFICIENT_DATA');
    });

    it('returns EMERGING_SIGNAL when sample size is between emerging and established', () => {
      expect(getConfidenceTier(4, 3, 7)).toBe('EMERGING_SIGNAL');
      expect(getConfidenceTier(6, 3, 7)).toBe('EMERGING_SIGNAL');
    });

    it('returns ESTABLISHED_SIGNAL when sample size meets established threshold', () => {
      expect(getConfidenceTier(7, 3, 7)).toBe('ESTABLISHED_SIGNAL');
      expect(getConfidenceTier(15, 3, 7)).toBe('ESTABLISHED_SIGNAL');
    });
  });

  describe('4. Execution & Consistency Feature Extraction', () => {
    it('calculates completion, skip, and reschedule rates accurately', () => {
      const mockTasks = [
        { status: 'COMPLETED', actualDurationMinutes: 30 },
        { status: 'COMPLETED', actualDurationMinutes: 45 },
        { status: 'COMPLETED', actualDurationMinutes: 15 },
        { status: 'SKIPPED' },
        { status: 'RESCHEDULED' },
      ];

      const feat = calculateExecutionFeatures(mockTasks, 7);
      expect(feat.tasksPlanned).toBe(5);
      expect(feat.tasksCompleted).toBe(3);
      expect(feat.tasksSkipped).toBe(1);
      expect(feat.tasksRescheduled).toBe(1);
      expect(feat.completionRate).toBe(60);
      expect(feat.skipRate).toBe(20);
      expect(feat.rescheduleRate).toBe(20);
      expect(feat.actualDurationTotalMinutes).toBe(90);
      expect(feat.confidence).toBe('EMERGING_SIGNAL');
    });

    it('computes completion variance and stability score', () => {
      const dates = ['2026-09-28', '2026-09-27', '2026-09-26'];
      const dailyCounts = [2, 2, 2];
      const feat = calculateConsistencyFeatures(dates, '2026-09-28', 7, dailyCounts);

      expect(feat.currentStreakDays).toBe(3);
      expect(feat.activeDaysCount).toBe(3);
      expect(feat.dailyCompletionVariance).toBe(0); // Perfect uniformity
      expect(feat.stabilityScore).toBeGreaterThan(0);
    });

    it('calculates routine adherence features', () => {
      const occurrences = [
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'SKIPPED' },
        { status: 'MISSED' },
      ];
      const feat = calculateRoutineFeatures(occurrences, 7);

      expect(feat.expectedOccurrences).toBe(4);
      expect(feat.completedOccurrences).toBe(2);
      expect(feat.adherenceRate).toBe(50);
      expect(feat.confidence).toBe('EMERGING_SIGNAL');
    });

    it('extracts well-being averages and detects improving/declining trend', () => {
      const checkins = [
        { mood: 2, energy: 2, dayRating: 2, localDate: '2026-09-21' },
        { mood: 3, energy: 3, dayRating: 3, localDate: '2026-09-22' },
        { mood: 4, energy: 4, dayRating: 4, localDate: '2026-09-27' },
        { mood: 5, energy: 5, dayRating: 5, localDate: '2026-09-28' },
      ];
      const feat = calculateWellBeingFeatures(checkins, 7);

      expect(feat.avgMood).toBe(3.5);
      expect(feat.avgEnergy).toBe(3.5);
      expect(feat.moodTrend).toBe('IMPROVING');
      expect(feat.confidence).toBe('EMERGING_SIGNAL');
    });

    it('computes life area entropy and detects dominant areas', () => {
      const activities = [
        { areaId: 'la-1', areaType: 'health', title: 'Health' },
        { areaId: 'la-1', areaType: 'health', title: 'Health' },
        { areaId: 'la-1', areaType: 'health', title: 'Health' },
        { areaId: 'la-1', areaType: 'health', title: 'Health' },
        { areaId: 'la-2', areaType: 'career', title: 'Career' },
      ];
      const feat = calculateLifeAreaFeatures(activities, 7);

      expect(feat.topAreaType).toBe('health');
      expect(feat.distributions.find((d: LifeAreaDistribution) => d.areaType === 'health')?.allocationPercentage).toBe(80);
      expect(feat.entropyScore).toBeLessThan(1.0); // Concentrated in health
    });
  });

  describe('5. Growth Signals Engine', () => {
    it('generates Consistency signal from execution and streak telemetry', () => {
      const exec = calculateExecutionFeatures([
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
      ], 7);
      const consist = calculateConsistencyFeatures(['2026-09-28', '2026-09-27', '2026-09-26', '2026-09-25'], '2026-09-28', 7, [1, 1, 1, 1]);
      const routine = calculateRoutineFeatures([{ status: 'COMPLETED' }, { status: 'COMPLETED' }], 7);

      const sig = calculateConsistencySignal(exec, consist, routine);
      expect(sig.type).toBe('CONSISTENCY');
      expect(sig.score).toBeGreaterThan(60);
      expect(sig.evidence.length).toBeGreaterThan(0);
    });

    it('generates Momentum signal comparing current 14d against prior 14d', () => {
      const current14d = calculateExecutionFeatures(Array(10).fill({ status: 'COMPLETED' }), 14);
      const previous14d = calculateExecutionFeatures(Array(5).fill({ status: 'COMPLETED' }), 14);

      const sig = calculateMomentumSignal(current14d, previous14d);
      expect(sig.type).toBe('MOMENTUM');
      expect(sig.direction).toBe('ACCELERATING');
      expect(sig.score).toBeGreaterThan(50);
    });

    it('generates Balance signal with SKEWED direction when allocation is concentrated', () => {
      const activities = Array(8).fill({ areaId: 'la-1', areaType: 'career', title: 'Career' });
      activities.push({ areaId: 'la-2', areaType: 'health', title: 'Health' });
      const feat = calculateLifeAreaFeatures(activities, 14);

      const sig = calculateBalanceSignal(feat);
      expect(sig.type).toBe('BALANCE');
      expect(sig.direction).toBe('SKEWED');
      expect(sig.summary.toLowerCase()).toContain('career');
    });
  });

  describe('6. Deterministic Gap Engine', () => {
    it('detects QUANTITY_GAP when goal metric value lags behind target', () => {
      const gaps = detectGaps({
        userId: 'u-1',
        goals: [
          {
            id: 'g-marathon',
            title: 'Weekly Mileage',
            priority: 1,
            targetMetricValue: 50,
            currentMetricValue: 30,
            unit: 'km',
          },
        ],
        execution7d: calculateExecutionFeatures([], 7),
        consistency7d: calculateConsistencyFeatures([], '2026-09-28', 7, []),
        routine7d: calculateRoutineFeatures([], 7),
        lifeAreas: calculateLifeAreaFeatures([], 7),
      });

      const quantityGap = gaps.find((g: GapFinding) => g.gapType === 'QUANTITY_GAP');
      expect(quantityGap).toBeDefined();
      expect(quantityGap?.magnitude).toBe(20);
      expect(quantityGap?.evidence[0]?.expected).toBe(50);
      expect(quantityGap?.evidence[0]?.actual).toBe(30);
    });

    it('detects EXECUTION_GAP when skip and reschedule rates exceed friction threshold', () => {
      const highFrictionTasks = [
        { status: 'COMPLETED' },
        { status: 'SKIPPED' },
        { status: 'SKIPPED' },
        { status: 'RESCHEDULED' },
        { status: 'RESCHEDULED' },
      ];
      const exec = calculateExecutionFeatures(highFrictionTasks, 7);

      const gaps = detectGaps({
        userId: 'u-1',
        goals: [],
        execution7d: exec,
        consistency7d: calculateConsistencyFeatures([], '2026-09-28', 7, []),
        routine7d: calculateRoutineFeatures([], 7),
        lifeAreas: calculateLifeAreaFeatures([], 7),
      });

      const execGap = gaps.find((g: GapFinding) => g.gapType === 'EXECUTION_GAP');
      expect(execGap).toBeDefined();
      expect(execGap?.title).toBe('Planning-to-Execution Friction');
    });

    it('detects PRIORITY_GAP when a Priority 1 goal receives zero task allocation', () => {
      const gaps = detectGaps({
        userId: 'u-1',
        goals: [
          {
            id: 'g-urgent',
            title: 'Master TypeScript AST',
            priority: 1,
          },
        ],
        execution7d: calculateExecutionFeatures(Array(5).fill({ status: 'COMPLETED' }), 7),
        consistency7d: calculateConsistencyFeatures([], '2026-09-28', 7, []),
        routine7d: calculateRoutineFeatures([], 7),
        lifeAreas: calculateLifeAreaFeatures([], 7),
        taskCompletionsByGoal: {
          'other-goal': 5,
          'g-urgent': 0, // 0 completed tasks for urgent goal!
        },
      });

      const priorityGap = gaps.find((g: GapFinding) => g.gapType === 'PRIORITY_GAP');
      expect(priorityGap).toBeDefined();
      expect(priorityGap?.title).toContain('Master TypeScript AST');
    });

    it('detects BALANCE_GAP when one life area absorbs over 75% of activities', () => {
      const skewedActivities = [
        ...Array(8).fill({ areaId: 'la-1', areaType: 'career', title: 'Career' }),
        { areaId: 'la-2', areaType: 'mind', title: 'Mind' },
      ];
      const lifeAreas = calculateLifeAreaFeatures(skewedActivities, 7);

      const gaps = detectGaps({
        userId: 'u-1',
        goals: [],
        execution7d: calculateExecutionFeatures([], 7),
        consistency7d: calculateConsistencyFeatures([], '2026-09-28', 7, []),
        routine7d: calculateRoutineFeatures([], 7),
        lifeAreas,
      });

      const balanceGap = gaps.find((g: GapFinding) => g.gapType === 'BALANCE_GAP');
      expect(balanceGap).toBeDefined();
      expect(balanceGap?.title).toContain('Career');
    });

    it('dynamically computes EXECUTION_GAP trend and confidence by comparing 7d vs 30d baselines', () => {
      // 7d: 2 completed out of 5 (40% completion rate, 40% skipped, 20% rescheduled)
      const tasks7d = [
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'SKIPPED' },
        { status: 'SKIPPED' },
        { status: 'RESCHEDULED' },
      ];
      const exec7d = calculateExecutionFeatures(tasks7d, 7);

      // Scenario A: 30d had 20% completion rate -> 7d is 40% -> IMPROVING
      const tasks30dLowerArray = [
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        ...Array(8).fill({ status: 'SKIPPED' }),
      ]; // 20%
      const exec30dLower = calculateExecutionFeatures(tasks30dLowerArray, 30);

      const improvingGaps = detectGaps({
        userId: 'u-1',
        goals: [],
        execution7d: exec7d,
        execution30d: exec30dLower,
        consistency7d: calculateConsistencyFeatures([], '2026-09-28', 7, []),
        routine7d: calculateRoutineFeatures([], 7),
        lifeAreas: calculateLifeAreaFeatures([], 7),
      });

      const execGapImproving = improvingGaps.find((g: GapFinding) => g.gapType === 'EXECUTION_GAP');
      expect(execGapImproving).toBeDefined();
      expect(execGapImproving?.trend).toBe('IMPROVING');
      expect(execGapImproving?.confidence).toBe('ESTABLISHED_SIGNAL');
      expect(execGapImproving?.algorithmVersion).toBe('1.1.0');

      // Scenario B: 30d had 70% completion rate -> 7d is 40% -> DECLINING
      const tasks30dHigherArray = [
        ...Array(7).fill({ status: 'COMPLETED' }),
        ...Array(3).fill({ status: 'SKIPPED' }),
      ]; // 70%
      const exec30dHigher = calculateExecutionFeatures(tasks30dHigherArray, 30);

      const decliningGaps = detectGaps({
        userId: 'u-1',
        goals: [],
        execution7d: exec7d,
        execution30d: exec30dHigher,
        consistency7d: calculateConsistencyFeatures([], '2026-09-28', 7, []),
        routine7d: calculateRoutineFeatures([], 7),
        lifeAreas: calculateLifeAreaFeatures([], 7),
      });

      const execGapDeclining = decliningGaps.find((g: GapFinding) => g.gapType === 'EXECUTION_GAP');
      expect(execGapDeclining).toBeDefined();
      expect(execGapDeclining?.trend).toBe('DECLINING');
      expect(execGapDeclining?.confidence).toBe('ESTABLISHED_SIGNAL');
      expect(execGapDeclining?.algorithmVersion).toBe('1.1.0');

      // Scenario C: 30d has identical 40% completion rate -> STABLE
      const tasks30dSameArray = [
        ...Array(4).fill({ status: 'COMPLETED' }),
        ...Array(6).fill({ status: 'SKIPPED' }),
      ]; // 40%
      const exec30dSame = calculateExecutionFeatures(tasks30dSameArray, 30);

      const stableGaps = detectGaps({
        userId: 'u-1',
        goals: [],
        execution7d: exec7d,
        execution30d: exec30dSame,
        consistency7d: calculateConsistencyFeatures([], '2026-09-28', 7, []),
        routine7d: calculateRoutineFeatures([], 7),
        lifeAreas: calculateLifeAreaFeatures([], 7),
      });

      const execGapStable = stableGaps.find((g: GapFinding) => g.gapType === 'EXECUTION_GAP');
      expect(execGapStable).toBeDefined();
      expect(execGapStable?.trend).toBe('STABLE');
    });
  });
});
