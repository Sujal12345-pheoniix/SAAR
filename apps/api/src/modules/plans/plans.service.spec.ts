/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';

describe('PlansService (Unit & Planning Workflows)', () => {
  let service: PlansService;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
    },
    plan: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    task: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockBehaviorEvents = {
    logEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BehaviorEventsService, useValue: mockBehaviorEvents },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    jest.clearAllMocks();
  });

  describe('getTodayPlan() & getOrCreatePlan()', () => {
    it('returns existing ACTIVE plan if one already exists for today', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ timezone: 'UTC' });
      const existingPlan = {
        id: 'plan-1',
        userId: 'user-a',
        localDate: new Date('2026-09-28'),
        status: 'ACTIVE',
        tasks: [],
      };
      mockPrisma.plan.findFirst.mockResolvedValueOnce(existingPlan);

      const result = await service.getTodayPlan('user-a');
      expect(result).toEqual(existingPlan);
      expect(mockPrisma.plan.create).not.toHaveBeenCalled();
    });

    it('creates a new ACTIVE plan with version 1 if no plan exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ timezone: 'UTC' });
      mockPrisma.plan.findFirst
        .mockResolvedValueOnce(null) // no active plan found
        .mockResolvedValueOnce(null); // no prior versions found

      const createdPlan = {
        id: 'plan-new',
        userId: 'user-a',
        version: 1,
        status: 'ACTIVE',
        tasks: [],
      };
      mockPrisma.plan.create.mockResolvedValueOnce(createdPlan);

      const result = await service.getTodayPlan('user-a');
      expect(result).toEqual(createdPlan);
      expect(mockPrisma.plan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-a',
            version: 1,
            status: 'ACTIVE',
          }),
        }),
      );
    });
  });

  describe('create() - Plan Versioning', () => {
    it('supersedes previous ACTIVE plans when creating a new plan version', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ timezone: 'UTC' });
      mockPrisma.plan.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.plan.findFirst.mockResolvedValueOnce({ version: 1 });
      mockPrisma.plan.create.mockResolvedValueOnce({
        id: 'plan-v2',
        userId: 'user-a',
        version: 2,
        status: 'ACTIVE',
      });

      const result = await service.create('user-a', { localDate: '2026-09-28' });
      expect(result.version).toBe(2);
      expect(mockPrisma.plan.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-a',
          localDate: expect.any(Date),
          status: 'ACTIVE',
        },
        data: { status: 'SUPERSEDED' },
      });
    });
  });

  describe('addTask() & removeTask()', () => {
    it('adds a task to the plan after verifying plan and task ownership', async () => {
      mockPrisma.plan.findFirst.mockResolvedValueOnce({ id: 'plan-1', userId: 'user-a' });
      mockPrisma.task.findFirst.mockResolvedValueOnce({ id: 'task-1', userId: 'user-a' });
      mockPrisma.task.update.mockResolvedValueOnce({
        id: 'task-1',
        planId: 'plan-1',
        priority: 1,
      });

      const result = await service.addTask('user-a', 'plan-1', { taskId: 'task-1', order: 1 });
      expect(result.planId).toBe('plan-1');
      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: { planId: 'plan-1', priority: 1 },
        }),
      );
    });

    it('rejects adding a task if plan does not belong to user', async () => {
      mockPrisma.plan.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.addTask('user-a', 'plan-foreign', { taskId: 'task-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('removes a task from plan by setting planId to null', async () => {
      mockPrisma.plan.findFirst.mockResolvedValueOnce({ id: 'plan-1', userId: 'user-a' });
      mockPrisma.task.findFirst.mockResolvedValueOnce({ id: 'task-1', userId: 'user-a', planId: 'plan-1' });
      mockPrisma.task.update.mockResolvedValueOnce({ id: 'task-1', planId: null });

      const result = await service.removeTask('user-a', 'plan-1', 'task-1');
      expect(result.planId).toBeNull();
    });
  });

  describe('reorderTasks()', () => {
    it('updates priority ordering for all tasks belonging to the plan', async () => {
      mockPrisma.plan.findFirst.mockResolvedValueOnce({ id: 'plan-1', userId: 'user-a' });
      mockPrisma.task.findMany.mockResolvedValueOnce([
        { id: 'task-1', planId: 'plan-1' },
        { id: 'task-2', planId: 'plan-1' },
      ]);
      mockPrisma.task.update.mockResolvedValue({});
      mockPrisma.plan.findFirst.mockResolvedValueOnce({
        id: 'plan-1',
        tasks: [
          { id: 'task-2', priority: 1 },
          { id: 'task-1', priority: 2 },
        ],
      });

      const result = await service.reorderTasks('user-a', 'plan-1', [
        { taskId: 'task-2', order: 1 },
        { taskId: 'task-1', order: 2 },
      ]);

      expect(mockPrisma.task.update).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('rejects reordering if any task does not belong to the plan', async () => {
      mockPrisma.plan.findFirst.mockResolvedValueOnce({ id: 'plan-1', userId: 'user-a' });
      mockPrisma.task.findMany.mockResolvedValueOnce([
        { id: 'task-1', planId: 'plan-1' }, // only 1 task returned, but 2 requested
      ]);

      await expect(
        service.reorderTasks('user-a', 'plan-1', [
          { taskId: 'task-1', order: 1 },
          { taskId: 'foreign-task', order: 2 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
