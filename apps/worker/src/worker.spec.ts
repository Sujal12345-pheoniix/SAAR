/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid';
import { OutboxPublisherService, OutboxRow } from './outbox/outbox-publisher.service';
import { NotificationWorkerService } from './notifications/notification-worker.service';
import { MockNotificationProvider } from './notifications/notification-provider.interface';
import { DailyPlanGeneratorService } from './daily-growth/daily-plan-generator.service';
import { RoutineOccurrenceGeneratorService } from './routines/routine-occurrence-generator.service';
import { MaintenanceWorkerService } from './maintenance/maintenance-worker.service';
import { GrowthAggregationWorkerService } from './growth-engine/growth-aggregation-worker.service';
import { InterventionOutcomeWorkerService } from './growth-engine/intervention-outcome-worker.service';

describe('SAAR Part 2C — Worker & Outbox Reliability Unit Tests', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb: (tx: any) => any) => cb(mockPrisma)),
      $queryRaw: jest.fn(),
      outboxEvent: {
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      notification: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      device: {
        deleteMany: jest.fn(),
      },
      plan: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      task: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      routineOccurrence: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      session: {
        deleteMany: jest.fn(),
      },
    };
  });

  describe('1. Outbox Claiming & State Machine', () => {
    it('claims pending outbox events using SELECT FOR UPDATE SKIP LOCKED', async () => {
      const publisher = new OutboxPublisherService(mockPrisma);
      const fakeClaimed: OutboxRow[] = [
        {
          id: uuidv4(),
          userId: uuidv4(),
          eventType: 'task.completed',
          schemaVersion: 1,
          aggregateType: 'Task',
          aggregateId: uuidv4(),
          payload: { taskId: uuidv4() },
          status: 'PROCESSING',
          attempts: 1,
          availableAt: new Date(),
          processedAt: null,
          createdAt: new Date(),
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValueOnce(fakeClaimed);
      const claimed = await publisher.claimPendingEvents(10);

      expect(claimed).toHaveLength(1);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('transitions outbox event to PROCESSED on successful dispatch', async () => {
      const publisher = new OutboxPublisherService(mockPrisma);
      const fakeEvent: OutboxRow = {
        id: uuidv4(),
        userId: uuidv4(),
        eventType: 'task.completed',
        schemaVersion: 1,
        aggregateType: 'Task',
        aggregateId: uuidv4(),
        payload: { taskId: uuidv4() },
        status: 'PROCESSING',
        attempts: 1,
        availableAt: new Date(),
        processedAt: null,
        createdAt: new Date(),
      };

      await publisher.processSingleOutboxEvent(fakeEvent);

      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: fakeEvent.id },
          data: expect.objectContaining({
            status: 'PROCESSED',
          }),
        }),
      );
    });

    it('applies exponential backoff on transient failure', async () => {
      const publisher = new OutboxPublisherService(mockPrisma);
      const fakeEvent: OutboxRow = {
        id: uuidv4(),
        userId: uuidv4(),
        eventType: '', // intentionally invalid to trigger failure
        schemaVersion: 1,
        aggregateType: 'Task',
        aggregateId: uuidv4(),
        payload: { taskId: uuidv4() },
        status: 'PROCESSING',
        attempts: 1,
        availableAt: new Date(),
        processedAt: null,
        createdAt: new Date(),
      };

      await publisher.processSingleOutboxEvent(fakeEvent);

      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: fakeEvent.id },
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });

    it('transitions event to DEAD_LETTER when maximum attempts (5) are reached', async () => {
      const publisher = new OutboxPublisherService(mockPrisma);
      const fakeEvent: OutboxRow = {
        id: uuidv4(),
        userId: uuidv4(),
        eventType: '', // will throw
        schemaVersion: 1,
        aggregateType: 'Task',
        aggregateId: uuidv4(),
        payload: { taskId: uuidv4() },
        status: 'PROCESSING',
        attempts: 4, // 4th attempt failing leads to 5th attempt -> DEAD_LETTER
        availableAt: new Date(),
        processedAt: null,
        createdAt: new Date(),
      };

      await publisher.processSingleOutboxEvent(fakeEvent);

      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: fakeEvent.id },
          data: expect.objectContaining({
            status: 'DEAD_LETTER',
          }),
        }),
      );
    });
  });

  describe('2. Notification Worker & Idempotency', () => {
    it('successfully delivers notification and marks status SENT', async () => {
      const worker = new NotificationWorkerService(mockPrisma);
      const mockProvider = new MockNotificationProvider();
      worker.setProvider(mockProvider);

      const notificationId = uuidv4();
      const userId = uuidv4();
      const fakeNotification = {
        id: notificationId,
        userId,
        title: 'Morning Routine Reminder',
        body: 'Time to start your daily growth.',
        status: 'SCHEDULED',
        user: {
          id: userId,
          timezone: 'Asia/Kolkata',
          profile: {},
          devices: [{ pushTokenHash: 'mock-device-token-123' }],
        },
      };

      mockPrisma.notification.findUnique.mockResolvedValueOnce(fakeNotification);

      const jobPayload = {
        notificationId,
        userId,
        type: 'reminder',
        title: 'Morning Routine Reminder',
        body: 'Time to start your daily growth.',
        scheduledAt: new Date().toISOString(),
        channel: 'PUSH',
        idempotencyKey: `notif:${notificationId}`,
      };

      const result = await worker.processNotificationJob(jobPayload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe('SENT');
      expect(mockProvider.sentNotifications).toHaveLength(1);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: notificationId },
          data: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('performs idempotent skip if notification is already SENT', async () => {
      const worker = new NotificationWorkerService(mockPrisma);
      const mockProvider = new MockNotificationProvider();
      worker.setProvider(mockProvider);

      const notificationId = uuidv4();
      mockPrisma.notification.findUnique.mockResolvedValueOnce({
        id: notificationId,
        status: 'SENT',
        user: { timezone: 'UTC', devices: [] },
      });

      const jobPayload = {
        notificationId,
        userId: uuidv4(),
        type: 'reminder',
        title: 'Test',
        body: 'Test',
        scheduledAt: new Date().toISOString(),
        idempotencyKey: `notif:${notificationId}`,
      };

      const result = await worker.processNotificationJob(jobPayload);

      expect(result.processed).toBe(true);
      expect(result.status).toBe('ALREADY_SENT');
      expect(mockProvider.sentNotifications).toHaveLength(0);
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('rejects malformed job payload with validation error', async () => {
      const worker = new NotificationWorkerService(mockPrisma);
      const result = await worker.processNotificationJob({
        // missing required fields
        notificationId: 'not-a-uuid',
      });

      expect(result.processed).toBe(false);
      expect(result.status).toBe('REJECTED_INVALID_PAYLOAD');
    });
  });

  describe('3. Daily Plan Generator & Idempotency', () => {
    it('creates a new plan when no active plan exists for localDate', async () => {
      const generator = new DailyPlanGeneratorService(mockPrisma);
      const userId = uuidv4();
      const planId = uuidv4();

      mockPrisma.plan.findFirst.mockResolvedValueOnce(null);
      mockPrisma.task.findMany.mockResolvedValueOnce([
        { id: uuidv4(), title: 'Task 1', priority: 1 },
      ]);
      mockPrisma.plan.create.mockResolvedValueOnce({
        id: planId,
        userId,
        status: 'ACTIVE',
        tasks: [],
      });

      const result = await generator.generateDailyPlan({
        userId,
        localDate: '2026-09-25',
        timezone: 'Asia/Kolkata',
        idempotencyKey: `plan:${userId}:2026-09-25`,
        forceRegenerate: false,
      });

      expect(result.planId).toBe(planId);
      expect(result.isNew).toBe(true);
      expect(mockPrisma.plan.create).toHaveBeenCalled();
    });

    it('idempotently skips generation if active plan already exists', async () => {
      const generator = new DailyPlanGeneratorService(mockPrisma);
      const userId = uuidv4();
      const existingPlanId = uuidv4();

      mockPrisma.plan.findFirst.mockResolvedValueOnce({
        id: existingPlanId,
        userId,
        status: 'ACTIVE',
        tasks: [{ id: 't1' }, { id: 't2' }],
      });

      const result = await generator.generateDailyPlan({
        userId,
        localDate: '2026-09-25',
        timezone: 'Asia/Kolkata',
        idempotencyKey: `plan:${userId}:2026-09-25`,
        forceRegenerate: false,
      });

      expect(result.planId).toBe(existingPlanId);
      expect(result.isNew).toBe(false);
      expect(result.taskCount).toBe(2);
      expect(mockPrisma.plan.create).not.toHaveBeenCalled();
    });
  });

  describe('4. Routine Occurrence Generator & Uniqueness', () => {
    it('creates a daily occurrence record if not already present', async () => {
      const generator = new RoutineOccurrenceGeneratorService(mockPrisma);
      const routineId = uuidv4();
      const userId = uuidv4();
      const occurrenceId = uuidv4();

      mockPrisma.routineOccurrence.findUnique.mockResolvedValueOnce(null);
      mockPrisma.routineOccurrence.create.mockResolvedValueOnce({
        id: occurrenceId,
        routineId,
        userId,
        status: 'PENDING',
      });

      const result = await generator.generateOccurrence({
        routineId,
        userId,
        localDate: '2026-09-25',
        expectedAt: new Date().toISOString(),
        idempotencyKey: `routine:${routineId}:2026-09-25`,
      });

      expect(result.occurrenceId).toBe(occurrenceId);
      expect(result.isNew).toBe(true);
      expect(mockPrisma.routineOccurrence.create).toHaveBeenCalled();
    });

    it('idempotently returns existing occurrence if already generated for today', async () => {
      const generator = new RoutineOccurrenceGeneratorService(mockPrisma);
      const routineId = uuidv4();
      const existingId = uuidv4();

      mockPrisma.routineOccurrence.findUnique.mockResolvedValueOnce({
        id: existingId,
        routineId,
        status: 'PENDING',
      });

      const result = await generator.generateOccurrence({
        routineId,
        userId: uuidv4(),
        localDate: '2026-09-25',
        expectedAt: new Date().toISOString(),
        idempotencyKey: `routine:${routineId}:2026-09-25`,
      });

      expect(result.occurrenceId).toBe(existingId);
      expect(result.isNew).toBe(false);
      expect(mockPrisma.routineOccurrence.create).not.toHaveBeenCalled();
    });
  });

  describe('5. Maintenance & Retention Jobs', () => {
    it('purges sessions older than retention boundary', async () => {
      const maintenance = new MaintenanceWorkerService(mockPrisma);
      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 42 });

      const result = await maintenance.cleanupExpiredSessions(30);

      expect(result.deletedCount).toBe(42);
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: expect.any(Object),
          }),
        }),
      );
    });

    it('prunes processed outbox events older than retention boundary', async () => {
      const maintenance = new MaintenanceWorkerService(mockPrisma);
      mockPrisma.outboxEvent.deleteMany.mockResolvedValueOnce({ count: 150 });

      const result = await maintenance.pruneProcessedOutboxEvents(7);

      expect(result.deletedCount).toBe(150);
      expect(mockPrisma.outboxEvent.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PROCESSED',
          }),
        }),
      );
    });
  });

  describe('6. Growth Aggregation Worker & Idempotency', () => {
    it('aggregates behavioral features and detects gaps for user', async () => {
      mockPrisma.user = {
        findUnique: jest.fn().mockResolvedValue({ id: 'user-1', timezone: 'UTC' }),
      };
      mockPrisma.goal = {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'g-1',
            title: 'Exercise',
            priority: 1,
            lifeArea: { type: 'health' },
            metrics: [{ targetValue: 5, currentValue: 2, unit: 'times' }],
          },
        ]),
      };
      mockPrisma.insight = {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'ins-1' }),
      };
      mockPrisma.task.findMany.mockResolvedValueOnce([
        { status: 'COMPLETED', completedAt: new Date(), actualDurationMinutes: 30, goalId: 'g-1' },
      ]);
      mockPrisma.routineOccurrence.findMany = jest.fn().mockResolvedValueOnce([
        { status: 'COMPLETED' },
      ]);

      const worker = new GrowthAggregationWorkerService(mockPrisma);
      const res = await worker.aggregateUserGrowth('user-1');

      expect(res.gapsDetected).toBeGreaterThanOrEqual(1);
      expect(mockPrisma.insight.create).toHaveBeenCalled();
    });
  });

  describe('7. Intervention Outcome Worker & Measurement', () => {
    it('evaluates elapsed interventions and updates outcome delta', async () => {
      const pastDate = new Date(Date.now() - 10 * 86_400_000); // 10 days ago (window was 7)
      mockPrisma.intervention = {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'int-worker-1',
            userId: 'user-worker-1',
            actionType: 'SPLIT_TASK',
            status: 'ACCEPTED',
            executedAt: pastDate,
            payload: {
              measurementWindowDays: 7,
              baselineMetric: { name: 'task_completion_rate', value: 30, unit: '%' },
            },
          },
        ]),
        update: jest.fn().mockResolvedValue({ id: 'int-worker-1', status: 'COMPLETED' }),
      };
      mockPrisma.task = {
        findMany: jest.fn().mockResolvedValue([{ id: 't-comp-1' }]),
        count: jest.fn().mockResolvedValue(1),
      };
      mockPrisma.outboxEvent.create = jest.fn().mockResolvedValue({ id: 'outbox-1' });

      const worker = new InterventionOutcomeWorkerService(mockPrisma);
      const res = await worker.evaluatePendingOutcomes();

      expect(res.evaluatedCount).toBe(1);
      expect(mockPrisma.intervention.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'int-worker-1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });
  });
});

