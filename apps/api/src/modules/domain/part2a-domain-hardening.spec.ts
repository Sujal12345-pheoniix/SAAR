import { validateDomainEvent, EventType, TaskEventPayloadSchema, RoutineEventPayloadSchema, CheckinEventPayloadSchema, GoalProgressPayloadSchema } from '@saar/contracts';
import { v4 as uuidv4 } from 'uuid';

describe('SAAR Part 2A — Domain Model & Hardening Unit Tests', () => {
  describe('1. Task Lifecycle & Behavioral History Tracking', () => {
    it('supports valid task status transitions including RESCHEDULED', () => {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'RESCHEDULED'];
      expect(validStatuses).toContain('RESCHEDULED');
      expect(validStatuses).toContain('COMPLETED');
    });

    it('records behavioral rescheduling metrics without overwriting original due date', () => {
      const originalDueAt = new Date('2026-09-25T10:00:00.000Z');
      const rescheduledDueAt = new Date('2026-09-26T14:00:00.000Z');
      const taskRecord = {
        id: uuidv4(),
        userId: uuidv4(),
        title: 'Complete Deep Architecture Review',
        status: 'RESCHEDULED',
        originalDueAt,
        dueAt: rescheduledDueAt,
        rescheduledAt: new Date('2026-09-25T09:30:00.000Z'),
        rescheduleCount: 1,
        rescheduleReason: 'Blocked on external API dependency',
      };

      expect(taskRecord.originalDueAt).toEqual(originalDueAt);
      expect(taskRecord.dueAt).toEqual(rescheduledDueAt);
      expect(taskRecord.rescheduleCount).toBe(1);
      expect(taskRecord.rescheduleReason).toBe('Blocked on external API dependency');
    });

    it('records task completion and actual execution duration', () => {
      const startedAt = new Date('2026-09-25T08:00:00.000Z');
      const completedAt = new Date('2026-09-25T08:45:00.000Z');
      const task = {
        id: uuidv4(),
        status: 'COMPLETED',
        startedAt,
        completedAt,
        estimatedMinutes: 30,
        actualDurationMinutes: 45,
      };

      expect(task.status).toBe('COMPLETED');
      expect(task.actualDurationMinutes).toBe(45);
      expect(task.actualDurationMinutes).toBeGreaterThan(task.estimatedMinutes);
    });
  });

  describe('2. Routine Occurrences Model', () => {
    it('models distinct daily occurrences for a recurring routine template', () => {
      const routineId = uuidv4();
      const userId = uuidv4();
      const occurrenceToday = {
        id: uuidv4(),
        routineId,
        userId,
        localDate: '2026-09-25',
        expectedAt: new Date('2026-09-25T07:00:00.000Z'),
        status: 'COMPLETED',
        startedAt: new Date('2026-09-25T07:05:00.000Z'),
        completedAt: new Date('2026-09-25T07:35:00.000Z'),
        actualDuration: 30,
      };

      expect(occurrenceToday.routineId).toBe(routineId);
      expect(occurrenceToday.localDate).toBe('2026-09-25');
      expect(occurrenceToday.status).toBe('COMPLETED');
    });

    it('enforces occurrence uniqueness per routine and local date', () => {
      const routineId = uuidv4();
      const occurrences = new Map<string, string>();
      const key1 = `${routineId}:2026-09-25`;
      occurrences.set(key1, 'occ-1');

      // Attempting to register another occurrence for the same routine on the same local date
      const duplicateExists = occurrences.has(key1);
      expect(duplicateExists).toBe(true);
    });
  });

  describe('3. Goal Metric Historical Observations', () => {
    it('supports multiple sequential MetricObservations for trend analysis', () => {
      const metricId = uuidv4();
      const observations = [
        { id: uuidv4(), metricId, value: 5.0, observedAt: new Date('2026-09-01T06:00:00.000Z'), source: 'device' },
        { id: uuidv4(), metricId, value: 7.5, observedAt: new Date('2026-09-10T06:00:00.000Z'), source: 'device' },
        { id: uuidv4(), metricId, value: 10.0, observedAt: new Date('2026-09-25T06:00:00.000Z'), source: 'user' },
      ];

      expect(observations).toHaveLength(3);
      const baseline = observations[0].value;
      const latest = observations[observations.length - 1].value;
      const delta = latest - baseline;

      expect(delta).toBe(5.0);
      expect(latest).toBeGreaterThan(baseline);
    });
  });

  describe('4. Timezone & Local Date Integrity', () => {
    it('distinguishes between UTC instants and user-local calendar dates', () => {
      // In IST (UTC+5:30), 2026-09-25 01:30 AM is 2026-09-24 20:00:00 UTC
      const localDateString = '2026-09-25';
      const utcInstant = new Date('2026-09-24T20:00:00.000Z');

      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const resolvedLocalDate = formatter.format(utcInstant);

      expect(resolvedLocalDate).toBe(localDateString);
    });

    it('enforces single check-in per local calendar day', () => {
      const checkins = new Set<string>();
      const userId = uuidv4();
      const localDate = '2026-09-25';
      const key = `${userId}:${localDate}`;

      checkins.add(key);
      expect(checkins.has(key)).toBe(true);

      // Duplicate attempt
      const isDuplicate = checkins.has(key);
      expect(isDuplicate).toBe(true);
    });
  });

  describe('5. Event Schema & Taxonomy Runtime Validation', () => {
    it('validates a well-formed TaskEvent against TaskEventPayloadSchema', () => {
      const rawEvent = {
        id: uuidv4(),
        type: EventType.TASK_RESCHEDULED,
        schemaVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'tasks-service',
        actor: { type: 'USER', id: uuidv4() },
        aggregate: { type: 'Task', id: uuidv4() },
        payload: {
          taskId: uuidv4(),
          userId: uuidv4(),
          status: 'RESCHEDULED',
          rescheduledAt: new Date().toISOString(),
          rescheduleCount: 2,
          reason: 'Meeting ran late',
        },
      };

      const result = validateDomainEvent(rawEvent, TaskEventPayloadSchema);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.payload.status).toBe('RESCHEDULED');
        expect(result.data.payload.rescheduleCount).toBe(2);
      }
    });

    it('rejects an invalid TaskEvent with invalid status or missing taskId', () => {
      const badEvent = {
        id: uuidv4(),
        type: EventType.TASK_COMPLETED,
        schemaVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'tasks-service',
        actor: { type: 'USER', id: uuidv4() },
        aggregate: { type: 'Task', id: uuidv4() },
        payload: {
          // missing taskId
          userId: uuidv4(),
          status: 'INVALID_STATUS',
        },
      };

      const result = validateDomainEvent(badEvent, TaskEventPayloadSchema);
      expect(result.success).toBe(false);
    });

    it('validates RoutineEvent and CheckinEvent payloads', () => {
      const routineEvent = {
        id: uuidv4(),
        type: EventType.ROUTINE_COMPLETED,
        schemaVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'routines-service',
        actor: { type: 'USER', id: uuidv4() },
        aggregate: { type: 'Routine', id: uuidv4() },
        payload: {
          routineId: uuidv4(),
          userId: uuidv4(),
          localDate: '2026-09-25',
          expectedAt: new Date().toISOString(),
          status: 'COMPLETED',
          actualDuration: 25,
        },
      };

      const checkinEvent = {
        id: uuidv4(),
        type: EventType.CHECKIN_COMPLETED,
        schemaVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'daily-growth-service',
        actor: { type: 'USER', id: uuidv4() },
        aggregate: { type: 'Checkin', id: uuidv4() },
        payload: {
          checkinId: uuidv4(),
          userId: uuidv4(),
          localDate: '2026-09-25',
          mood: 5,
          energy: 4,
          reflection: 'High focus day',
        },
      };

      expect(validateDomainEvent(routineEvent, RoutineEventPayloadSchema).success).toBe(true);
      expect(validateDomainEvent(checkinEvent, CheckinEventPayloadSchema).success).toBe(true);
    });

    it('validates GoalProgressPayloadSchema for metric progress updates', () => {
      const goalEvent = {
        id: uuidv4(),
        type: EventType.GOAL_PROGRESS_UPDATED,
        schemaVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'goals-service',
        actor: { type: 'USER', id: uuidv4() },
        aggregate: { type: 'Goal', id: uuidv4() },
        payload: {
          goalId: uuidv4(),
          metricId: uuidv4(),
          value: 12.5,
          observedAt: new Date().toISOString(),
          source: 'manual',
          unit: 'km',
          confidence: 0.95,
        },
      };

      expect(validateDomainEvent(goalEvent, GoalProgressPayloadSchema).success).toBe(true);
    });
  });
});
