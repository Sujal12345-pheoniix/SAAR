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
});
