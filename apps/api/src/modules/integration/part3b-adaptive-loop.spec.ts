/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import { BehaviorAggregatorService } from '../growth-engine/behavior-aggregator.service';
import { SignalEngineService } from '../growth-engine/signal-engine.service';
import { GapEngineService } from '../growth-engine/gap-engine.service';
import { InterventionsService } from '../interventions/interventions.service';
import { ScheduleService } from '../schedule/schedule.service';
import { DailyGrowthOrchestratorService } from '../daily-growth/daily-growth-orchestrator.service';
import { DailyStateBuilderService } from '../daily-growth/services/daily-state-builder.service';
import { ExecutionAnalyzerService } from '../daily-growth/services/execution-analyzer.service';
import { GapAnalyzerService } from '../daily-growth/services/gap-analyzer.service';
import { TradeoffAnalyzerService } from '../daily-growth/services/tradeoff-analyzer.service';
import { InterventionSelectorService } from '../daily-growth/services/intervention-selector.service';
import { TomorrowPlannerService } from '../daily-growth/services/tomorrow-planner.service';

describe('Part 3B Adaptive Loop Integration Tests', () => {
  let interventionsService: InterventionsService;
  let scheduleService: ScheduleService;
  let orchestrator: DailyGrowthOrchestratorService;

  const mockPrisma: any = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-adapt-1', timezone: 'Asia/Kolkata' }),
    },
    futureSelf: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'fs-1',
        futureIdentity: 'AI Architect',
        horizonYears: 5,
        desiredStates: {},
      }),
    },
    goal: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'goal-p1', title: 'Deep Learning Mastery', priority: 1, metrics: [] },
      ]),
    },
    task: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'task-1',
          userId: 'user-adapt-1',
          title: 'Implement Transformer Attention',
          status: 'COMPLETED',
          priority: 1,
          goalId: 'goal-p1',
          lifeAreaId: 'la-1',
          dueAt: new Date('2026-09-28T10:00:00Z'),
          completedAt: new Date('2026-09-28T10:30:00Z'),
          actualDurationMinutes: 30,
          rescheduleCount: 0,
        },
        {
          id: 'task-2',
          userId: 'user-adapt-1',
          title: 'Backpropagation Debugging',
          status: 'TODO',
          priority: 2,
          goalId: 'goal-p1',
          lifeAreaId: 'la-1',
          dueAt: new Date('2026-09-28T14:00:00Z'),
          estimatedMinutes: 60,
          rescheduleCount: 2,
        },
      ]),
      count: jest.fn().mockResolvedValue(2),
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ ...where, ...data })),
    },
    routine: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'r-1', title: 'Morning Review', active: true, preferredTime: '08:00' },
      ]),
    },
    routineOccurrence: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    checkin: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'chk-1',
        userId: 'user-adapt-1',
        mood: 4,
        energy: 4,
        reflection: 'Strong progress on AI models',
        dayRating: 4,
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    plan: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'plan-v1',
        userId: 'user-adapt-1',
        localDate: new Date('2026-09-28'),
        version: 1,
        status: 'ACTIVE',
        tasks: [
          { id: 'task-1', title: 'Implement Transformer Attention', scheduledAt: new Date('2026-09-28T10:00:00Z'), estimatedMinutes: 30 },
          { id: 'task-2', title: 'Backpropagation Debugging', scheduledAt: new Date('2026-09-28T14:00:00Z'), estimatedMinutes: 60 },
        ],
      }),
      create: jest.fn().mockResolvedValue({
        id: 'plan-v2',
        version: 2,
        status: 'ACTIVE',
      }),
      update: jest.fn().mockResolvedValue({
        id: 'plan-v1',
        status: 'SUPERSEDED',
      }),
    },
    insight: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'ins-1',
        userId: 'user-adapt-1',
        status: 'NEW',
        type: 'friction',
      }),
      create: jest.fn().mockResolvedValue({ id: 'ins-new' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    intervention: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'int-1',
          userId: 'user-adapt-1',
          actionType: 'SPLIT_TASK',
          status: 'PROPOSED',
          payload: {
            title: 'Split Monolithic Task',
            reason: 'Task has high friction',
            baselineMetric: { name: 'task_completion_rate', value: 30, unit: '%' },
            measurementWindowDays: 7,
          },
        },
      ]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue({
        id: 'int-1',
        userId: 'user-adapt-1',
        actionType: 'SPLIT_TASK',
        status: 'PROPOSED',
        payload: {
          title: 'Split Monolithic Task',
          reason: 'Task has high friction',
          baselineMetric: { name: 'task_completion_rate', value: 30, unit: '%' },
          measurementWindowDays: 7,
        },
      }),
      create: jest.fn().mockResolvedValue({ id: 'int-new', actionType: 'SPLIT_TASK' }),
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ ...where, ...data })),
    },
    outboxEvent: {
      create: jest.fn().mockResolvedValue({ id: 'outbox-evt-1' }),
    },
    behaviorEvent: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'be-evt-1' }),
    },
  };

  const mockBehaviorEvents = {
    logEvent: jest.fn().mockResolvedValue({ id: 'logged-evt-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterventionsService,
        ScheduleService,
        DailyGrowthOrchestratorService,
        DailyStateBuilderService,
        ExecutionAnalyzerService,
        GapAnalyzerService,
        TradeoffAnalyzerService,
        InterventionSelectorService,
        TomorrowPlannerService,
        BehaviorAggregatorService,
        SignalEngineService,
        GapEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BehaviorEventsService, useValue: mockBehaviorEvents },
      ],
    }).compile();

    interventionsService = module.get<InterventionsService>(InterventionsService);
    scheduleService = module.get<ScheduleService>(ScheduleService);
    orchestrator = module.get<DailyGrowthOrchestratorService>(DailyGrowthOrchestratorService);

    jest.clearAllMocks();
  });

  describe('1. Closed-Loop Intervention Lifecycle', () => {
    it('progresses through PROPOSED -> ACCEPTED -> COMPLETED with measured outcome', async () => {
      // 1. Accept
      const accepted = await interventionsService.accept('user-adapt-1', 'int-1');
      expect(accepted.status).toBe('ACCEPTED');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'intervention.accepted' }),
        }),
      );

      // Setup mock for completion
      mockPrisma.intervention.findUnique.mockResolvedValueOnce({
        id: 'int-1',
        userId: 'user-adapt-1',
        actionType: 'SPLIT_TASK',
        status: 'ACCEPTED',
        payload: {
          title: 'Split Monolithic Task',
          baselineMetric: { name: 'task_completion_rate', value: 30, unit: '%' },
          measurementWindowDays: 7,
        },
      });

      // 2. Complete with post-window evaluation
      const completed = await interventionsService.complete('user-adapt-1', 'int-1', {
        postValue: 80,
      });

      expect(completed.status).toBe('COMPLETED');
      expect(completed.outcome).toBeDefined();
      expect((completed.outcome as any).improved).toBe(true);
      expect((completed.outcome as any).outcomeDelta).toBe(50);
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'intervention.completed' }),
        }),
      );
    });
  });

  describe('2. Schedule Simulation & Adaptation Flow', () => {
    it('simulates proposed adaptations and applies them into a new plan version', async () => {
      // 1. Simulate
      const sim = await scheduleService.simulate('user-adapt-1', {
        currentPlanVersion: 1,
        proposedTasks: [
          { id: 'task-1', title: 'Implement Transformer Attention', action: 'KEEP' },
          { id: 'task-2', title: 'Backpropagation Debugging', scheduledAt: '2026-09-28T16:00:00Z', action: 'MOVE' },
          { id: 'task-3', title: 'New Unit Tests', action: 'ADD' },
        ],
      });

      expect(sim.proposedPlanVersion).toBe(2);
      expect(sim.diff.tasksMoved).toHaveLength(1);
      expect(sim.diff.tasksAdded).toHaveLength(1);
      expect(sim.feasibilityScore).toBeGreaterThanOrEqual(80);

      // 2. Apply Adaptation
      const applied = await scheduleService.apply('user-adapt-1', {
        targetDate: '2026-09-28',
        finalTasks: [
          { id: 'task-1', title: 'Implement Transformer Attention' },
          { id: 'task-2', title: 'Backpropagation Debugging', scheduledAt: '2026-09-28T16:00:00Z' },
        ],
      });

      expect(applied.version).toBe(2);
      expect(applied.status).toBe('ACTIVE');
      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'schedule.adaptation_accepted' }),
        }),
      );
    });
  });

  describe('3. Daily Growth Orchestrator End-to-End Session', () => {
    it('compiles deterministic daily growth session state with 8-step pipeline', async () => {
      const state = await orchestrator.getDailyGrowthState('user-adapt-1', '2026-09-28');

      expect(state.date).toBe('2026-09-28');
      expect(state.checkin.completed).toBe(true);
      expect(state.execution.plannedTasksCount).toBeGreaterThan(0);
      expect(state.signals).toBeInstanceOf(Array);
      expect(state.gaps).toBeInstanceOf(Array);
      expect(state.interventions).toBeInstanceOf(Array);
      expect(state.tomorrowPlanPreview).toBeDefined();
      expect(state.tomorrowPlanPreview.targetDate).toBe('2026-09-29');
      expect(state.engineVersion).toBe('1.0.0');
    });

    it('idempotently starts and completes daily growth session', async () => {
      // Start session
      const startResult = await orchestrator.startSession('user-adapt-1', '2026-09-28');
      expect(startResult.status).toBe('IN_PROGRESS');
      expect(startResult.sessionId).toBe('daily_growth_user-adapt-1_2026-09-28');

      // Complete session
      const completeResult = await orchestrator.completeSession('user-adapt-1', '2026-09-28');
      expect(completeResult.status).toBe('COMPLETED');
      expect(completeResult.completedAt).toBeDefined();
    });
  });
});
