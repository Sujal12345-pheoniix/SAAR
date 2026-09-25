import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';

describe('TasksService (Unit & Multi-tenant Isolation)', () => {
  let service: TasksService;

  const mockPrisma = {
    task: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    goal: {
      findFirst: jest.fn(),
    },
    lifeArea: {
      findFirst: jest.fn(),
    },
  };

  const mockBehaviorEvents = {
    logEvent: jest.fn().mockResolvedValue({ id: 'evt-task-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BehaviorEventsService, useValue: mockBehaviorEvents },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('creates a task and logs task.created event', async () => {
      const task = {
        id: 't-1',
        userId: 'user-a',
        title: 'Morning Run',
        priority: 1,
        status: TaskStatus.TODO,
      };
      mockPrisma.task.create.mockResolvedValueOnce(task);

      const result = await service.create('user-a', {
        title: 'Morning Run',
        priority: 1,
      });

      expect(result).toEqual(task);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'task.created',
          entityId: 't-1',
        }),
      );
    });

    it('PREVENTS linking a task to a goal owned by another user', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null); // not found for user-a

      await expect(
        service.create('user-a', {
          title: 'Unauthorized Task',
          goalId: 'goal-owned-by-user-b',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Lifecycle State Transitions', () => {
    it('completes task and logs task.completed with completedAt timestamp', async () => {
      const existing = { id: 't-1', userId: 'user-a', status: TaskStatus.TODO };
      mockPrisma.task.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.task.update.mockResolvedValueOnce({
        ...existing,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      const updated = await service.complete('user-a', 't-1');
      expect(updated.status).toBe(TaskStatus.COMPLETED);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'task.completed',
          entityId: 't-1',
        }),
      );
    });

    it('skips task and logs task.skipped event', async () => {
      const existing = { id: 't-1', userId: 'user-a', status: TaskStatus.TODO };
      mockPrisma.task.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.task.update.mockResolvedValueOnce({
        ...existing,
        status: TaskStatus.SKIPPED,
      });

      const updated = await service.skip('user-a', 't-1');
      expect(updated.status).toBe(TaskStatus.SKIPPED);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'task.skipped',
          entityId: 't-1',
        }),
      );
    });

    it('reschedules task and logs task.rescheduled event', async () => {
      const existing = {
        id: 't-1',
        userId: 'user-a',
        dueAt: new Date('2026-09-25T08:00:00Z'),
        status: TaskStatus.TODO,
      };
      mockPrisma.task.findFirst.mockResolvedValueOnce(existing);
      const newDue = '2026-09-26T08:00:00.000Z';
      mockPrisma.task.update.mockResolvedValueOnce({
        ...existing,
        dueAt: new Date(newDue),
      });

      const updated = await service.reschedule('user-a', 't-1', newDue);
      expect(updated).toBeDefined();
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'task.rescheduled',
          entityId: 't-1',
        }),
      );
    });
  });

  describe('Cross-User Access Security (Tenant Isolation)', () => {
    it('FORBIDS User B from completing User A task', async () => {
      mockPrisma.task.findFirst.mockResolvedValueOnce(null);

      await expect(service.complete('user-b', 'task-owned-by-user-a')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it('FORBIDS User B from skipping User A task', async () => {
      mockPrisma.task.findFirst.mockResolvedValueOnce(null);

      await expect(service.skip('user-b', 'task-owned-by-user-a')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('FORBIDS User B from rescheduling User A task', async () => {
      mockPrisma.task.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.reschedule('user-b', 'task-owned-by-user-a', '2026-09-30T00:00:00Z'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
