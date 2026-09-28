/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorAggregatorService } from './behavior-aggregator.service';
import { SignalEngineService } from './signal-engine.service';
import { GapEngineService } from './gap-engine.service';
import { PrismaService } from '../../database/prisma.service';

describe('GrowthEngine Services (Unit & Integration)', () => {
  let aggregator: BehaviorAggregatorService;
  let signalEngine: SignalEngineService;
  let gapEngine: GapEngineService;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
    },
    task: {
      findMany: jest.fn().mockResolvedValue([
        { status: 'COMPLETED', actualDurationMinutes: 30, completedAt: new Date(), lifeArea: { id: 'la-1', title: 'Health', type: 'health' } },
        { status: 'COMPLETED', actualDurationMinutes: 45, completedAt: new Date(), lifeArea: { id: 'la-1', title: 'Health', type: 'health' } },
        { status: 'SKIPPED', actualDurationMinutes: null },
      ]),
    },
    routineOccurrence: {
      findMany: jest.fn().mockResolvedValue([
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
      ]),
    },
    checkin: {
      findMany: jest.fn().mockResolvedValue([
        { mood: 4, energy: 4, dayRating: 4, localDate: new Date() },
      ]),
    },
    goal: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'goal-1',
          title: 'Run 10K',
          priority: 1,
          lifeArea: { type: 'health' },
          metrics: [{ targetValue: 10, currentValue: 6, unit: 'km' }],
        },
      ]),
    },
    futureSelf: {
      findUnique: jest.fn().mockResolvedValue({
        futureIdentity: 'Endurance Athlete',
        horizonYears: 5,
      }),
    },
    insight: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'ins-1' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BehaviorAggregatorService,
        SignalEngineService,
        GapEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    aggregator = module.get<BehaviorAggregatorService>(BehaviorAggregatorService);
    signalEngine = module.get<SignalEngineService>(SignalEngineService);
    gapEngine = module.get<GapEngineService>(GapEngineService);
    jest.clearAllMocks();
  });

  it('aggregates multi-window feature snapshot', async () => {
    const snapshot = await aggregator.getFeatureSnapshot('user-1');
    expect(snapshot).toHaveProperty('execution7d');
    expect(snapshot).toHaveProperty('consistency7d');
    expect(snapshot).toHaveProperty('routine7d');
    expect(snapshot).toHaveProperty('lifeAreas14d');
    expect(snapshot.timezone).toBe('UTC');
  });

  it('evaluates Consistency, Momentum, and Balance signals', async () => {
    const signals = await signalEngine.getSignals('user-1');
    expect(signals.consistency).toBeDefined();
    expect(signals.momentum).toBeDefined();
    expect(signals.balance).toBeDefined();
    expect(signals.consistency.type).toBe('CONSISTENCY');
  });

  it('evaluates Gaps and creates Insight records in database', async () => {
    const findings = await gapEngine.evaluateGaps('user-1');
    expect(findings.length).toBeGreaterThan(0);
    const quantityGap = findings.find((f) => f.gapType === 'QUANTITY_GAP');
    expect(quantityGap).toBeDefined();
    expect(quantityGap?.magnitude).toBe(4); // 10 target - 6 current = 4
    expect(mockPrisma.insight.create).toHaveBeenCalled();
  });
});
