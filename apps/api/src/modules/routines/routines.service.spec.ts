/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoutineOccurrenceStatus } from '@prisma/client';
import { RoutinesService } from './routines.service';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';

describe('RoutinesService (Unit & Occurrences)', () => {
  let service: RoutinesService;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
    },
    routine: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    routineOccurrence: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockBehaviorEvents = {
    logEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutinesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BehaviorEventsService, useValue: mockBehaviorEvents },
      ],
    }).compile();

    service = module.get<RoutinesService>(RoutinesService);
    jest.clearAllMocks();
  });

  describe('create() & findAll()', () => {
    it('creates a routine using user timezone fallback', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ timezone: 'Asia/Kolkata' });
      const created = {
        id: 'r-1',
        userId: 'user-a',
        title: 'Morning Yoga',
        recurrenceRule: 'FREQ=DAILY',
        timezone: 'Asia/Kolkata',
        active: true,
      };
      mockPrisma.routine.create.mockResolvedValueOnce(created);

      const result = await service.create('user-a', {
        title: 'Morning Yoga',
        recurrenceRule: 'FREQ=DAILY',
      });

      expect(result).toEqual(created);
      expect(mockPrisma.routine.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-a',
          title: 'Morning Yoga',
          timezone: 'Asia/Kolkata',
        }),
      });
    });
  });

  describe('pause() and resume()', () => {
    it('pauses an active routine and sets active to false', async () => {
      mockPrisma.routine.findFirst.mockResolvedValueOnce({
        id: 'r-1',
        userId: 'user-a',
        active: true,
      });
      mockPrisma.routine.update.mockResolvedValueOnce({
        id: 'r-1',
        active: false,
      });

      const result = await service.pause('user-a', 'r-1');
      expect(result.active).toBe(false);
    });

    it('resumes a paused routine and sets active to true', async () => {
      mockPrisma.routine.findFirst.mockResolvedValueOnce({
        id: 'r-1',
        userId: 'user-a',
        active: false,
      });
      mockPrisma.routine.update.mockResolvedValueOnce({
        id: 'r-1',
        active: true,
      });

      const result = await service.resume('user-a', 'r-1');
      expect(result.active).toBe(true);
    });
  });

  describe('Routine Occurrences', () => {
    it('creates or gets an occurrence idempotently via upsert', async () => {
      mockPrisma.routine.findFirst.mockResolvedValueOnce({
        id: 'r-1',
        userId: 'user-a',
        preferredTime: '06:30',
      });
      const occurrence = {
        id: 'occ-1',
        routineId: 'r-1',
        userId: 'user-a',
        localDate: new Date('2026-09-28'),
        status: RoutineOccurrenceStatus.PENDING,
      };
      mockPrisma.routineOccurrence.upsert.mockResolvedValueOnce(occurrence);

      const result = await service.getOrCreateOccurrence('user-a', 'r-1', '2026-09-28');
      expect(result).toEqual(occurrence);
    });

    it('completes an occurrence, records actual duration, and logs routine.completed event', async () => {
      mockPrisma.routineOccurrence.findFirst.mockResolvedValueOnce({
        id: 'occ-1',
        routineId: 'r-1',
        userId: 'user-a',
        status: RoutineOccurrenceStatus.PENDING,
        localDate: new Date('2026-09-28'),
      });
      mockPrisma.routine.findFirst.mockResolvedValueOnce({ id: 'r-1', title: 'Meditation' });
      mockPrisma.routineOccurrence.update.mockResolvedValueOnce({
        id: 'occ-1',
        status: RoutineOccurrenceStatus.COMPLETED,
        actualDuration: 20,
      });

      const result = await service.completeOccurrence('user-a', 'r-1', 'occ-1', {
        actualDuration: 20,
      });

      expect(result.status).toBe(RoutineOccurrenceStatus.COMPLETED);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'routine.completed',
          entityType: 'RoutineOccurrence',
        }),
      );
    });

    it('skips an occurrence with reason and logs routine.skipped event', async () => {
      mockPrisma.routineOccurrence.findFirst.mockResolvedValueOnce({
        id: 'occ-1',
        routineId: 'r-1',
        userId: 'user-a',
        status: RoutineOccurrenceStatus.PENDING,
      });
      mockPrisma.routineOccurrence.update.mockResolvedValueOnce({
        id: 'occ-1',
        status: RoutineOccurrenceStatus.SKIPPED,
        reason: 'Feeling unwell',
      });

      const result = await service.skipOccurrence('user-a', 'r-1', 'occ-1', 'Feeling unwell');
      expect(result.status).toBe(RoutineOccurrenceStatus.SKIPPED);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'routine.skipped',
          metadata: expect.objectContaining({ reason: 'Feeling unwell' }),
        }),
      );
    });

    it('rejects completing occurrence belonging to another user', async () => {
      mockPrisma.routineOccurrence.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.completeOccurrence('user-b', 'r-1', 'occ-owned-by-user-a'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
