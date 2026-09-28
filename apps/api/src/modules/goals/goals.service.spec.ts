/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GoalStatus } from '@prisma/client';
import { GoalsService } from './goals.service';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';

describe('GoalsService (Unit & Multi-tenant Isolation)', () => {
  let service: GoalsService;

  const mockPrisma: any = {
    goal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    goalMetric: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    lifeArea: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockBehaviorEvents = {
    logEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BehaviorEventsService, useValue: mockBehaviorEvents },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('creates a goal and logs goal.created behavior event', async () => {
      const createdGoal = {
        id: 'goal-1',
        userId: 'user-a',
        title: 'Run a marathon',
        priority: 1,
        status: GoalStatus.ACTIVE,
      };
      mockPrisma.goal.create.mockResolvedValueOnce(createdGoal);

      const result = await service.create('user-a', {
        title: 'Run a marathon',
        priority: 1,
        metrics: [{ metricType: 'distance', targetValue: 42.195, unit: 'km' }],
      });

      expect(result).toEqual(createdGoal);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'goal.created',
          entityId: 'goal-1',
        }),
      );
    });

    it('PREVENTS linking a goal to a life area owned by another user', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValueOnce(null); // life area belongs to user-b, not user-a

      await expect(
        service.create('user-a', {
          title: 'Steal Life Area',
          lifeAreaId: 'life-area-of-user-b',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.goal.create).not.toHaveBeenCalled();
    });
  });

  describe('Cross-User Access Security (Tenant Isolation)', () => {
    it('FORBIDS User B from viewing User A goal (throws NotFoundException)', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('user-b', 'goal-owned-by-user-a')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('FORBIDS User B from updating User A goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update('user-b', 'goal-owned-by-user-a', { title: 'Compromised' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('FORBIDS User B from archiving User A goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null);

      await expect(service.archive('user-b', 'goal-owned-by-user-a')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.goal.update).not.toHaveBeenCalled();
    });

    it('allows User A to archive their own goal and emits goal.updated event', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce({ id: 'g-1', userId: 'user-a' });
      mockPrisma.goal.update.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.ARCHIVED,
      });

      const result = await service.archive('user-a', 'g-1');
      expect(result.status).toBe(GoalStatus.ARCHIVED);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'goal.updated',
          metadata: expect.objectContaining({ action: 'archive' }),
        }),
      );
    });
  });

  describe('Lifecycle State Transitions (complete, pause, reopen)', () => {
    it('completes an ACTIVE goal and emits goal.completed event', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.ACTIVE,
        title: 'Run 10K',
      });
      mockPrisma.goal.update.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.COMPLETED,
        title: 'Run 10K',
      });

      const result = await service.complete('user-a', 'g-1');
      expect(result.status).toBe(GoalStatus.COMPLETED);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'goal.completed',
        }),
      );
    });

    it('is idempotent when completing an already COMPLETED goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.COMPLETED,
      });

      const result = await service.complete('user-a', 'g-1');
      expect(result.status).toBe(GoalStatus.COMPLETED);
      expect(mockPrisma.goal.update).not.toHaveBeenCalled();
    });

    it('pauses an ACTIVE goal and emits goal.updated event', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.ACTIVE,
      });
      mockPrisma.goal.update.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.PAUSED,
      });

      const result = await service.pause('user-a', 'g-1');
      expect(result.status).toBe(GoalStatus.PAUSED);
    });

    it('reopens a COMPLETED goal back to ACTIVE', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.COMPLETED,
      });
      mockPrisma.goal.update.mockResolvedValueOnce({
        id: 'g-1',
        userId: 'user-a',
        status: GoalStatus.ACTIVE,
      });

      const result = await service.reopen('user-a', 'g-1');
      expect(result.status).toBe(GoalStatus.ACTIVE);
    });
  });

  describe('Metric Observations Tracking', () => {
    it('records an observation and updates the currentValue on GoalMetric', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce({ id: 'g-1', userId: 'user-a' });
      mockPrisma.goalMetric = {
        ...mockPrisma.goalMetric,
        findFirst: jest.fn().mockResolvedValueOnce({ id: 'm-1', goalId: 'g-1', unit: 'km' }),
        update: jest.fn().mockResolvedValueOnce({ id: 'm-1', currentValue: 15 }),
      };
      mockPrisma.metricObservation = {
        create: jest.fn().mockResolvedValueOnce({
          id: 'obs-1',
          metricId: 'm-1',
          value: 15,
          unit: 'km',
        }),
      };

      const obs = await service.recordObservation('user-a', 'g-1', 'm-1', {
        value: 15,
        source: 'device',
      });

      expect(obs.value).toBe(15);
      expect(mockPrisma.goalMetric.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm-1' },
          data: { currentValue: 15 },
        }),
      );
    });
  });
});

