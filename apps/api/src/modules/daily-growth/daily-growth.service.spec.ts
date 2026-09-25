import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatus } from '@prisma/client';
import { DailyGrowthService } from './daily-growth.service';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';

describe('DailyGrowthService (Deterministic Aggregation & Check-in)', () => {
  let service: DailyGrowthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Kolkata' }),
    },
    goal: {
      findMany: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    routine: {
      findMany: jest.fn(),
    },
    checkin: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    futureSelf: {
      findUnique: jest.fn(),
    },
    behaviorEvent: {
      findFirst: jest.fn(),
    },
  };

  const mockBehaviorEvents = {
    logEvent: jest.fn().mockResolvedValue({ id: 'evt-growth-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyGrowthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BehaviorEventsService, useValue: mockBehaviorEvents },
      ],
    }).compile();

    service = module.get<DailyGrowthService>(DailyGrowthService);
    jest.clearAllMocks();
  });

  describe('getToday()', () => {
    it('returns deterministic aggregation with calculated alignment score', async () => {
      mockPrisma.goal.findMany.mockResolvedValueOnce([{ id: 'g1', title: 'Goal 1' }]);
      mockPrisma.task.findMany.mockResolvedValueOnce([
        { id: 't1', status: TaskStatus.COMPLETED },
        { id: 't2', status: TaskStatus.TODO },
      ]);
      mockPrisma.routine.findMany.mockResolvedValueOnce([{ id: 'r1', title: 'Workout' }]);
      mockPrisma.checkin.findFirst.mockResolvedValueOnce({ id: 'chk1', mood: 4, energy: 4 });
      mockPrisma.futureSelf.findUnique.mockResolvedValueOnce({
        futureIdentity: 'Leader & Athlete',
        horizonYears: 5,
      });

      const result = await service.getToday('user-a');

      expect(result).toHaveProperty('date');
      expect(result.timezone).toBe('Asia/Kolkata');
      expect(result.summary.totalTasks).toBe(2);
      expect(result.summary.completedTasks).toBe(1);
      expect(result.summary.hasCheckedIn).toBe(true);
      // 50% task completion (25 pts) + checkin (25 pts) + routines (25 pts) = 75
      expect(result.alignmentScorePreview).toBe(75);
      expect(result.futureSelf?.futureIdentity).toBe('Leader & Athlete');
    });
  });

  describe('checkin()', () => {
    it('upserts check-in record and logs checkin.completed behavior event', async () => {
      const savedCheckin = {
        id: 'chk-123',
        userId: 'user-a',
        mood: 5,
        energy: 4,
        reflection: 'High productivity today',
        dayRating: 5,
      };
      mockPrisma.checkin.upsert.mockResolvedValueOnce(savedCheckin);

      const result = await service.checkin('user-a', {
        mood: 5,
        energy: 4,
        reflection: 'High productivity today',
        dayRating: 5,
      });

      expect(result).toEqual(savedCheckin);
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'checkin.completed',
          entityType: 'Checkin',
          entityId: 'chk-123',
        }),
      );
    });
  });

  describe('Daily Growth Session Shell', () => {
    it('startSession() emits daily_growth.started event', async () => {
      const session = await service.startSession('user-a');
      expect(session.status).toBe('in_progress');
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'daily_growth.started',
        }),
      );
    });

    it('completeSession() emits daily_growth.completed event', async () => {
      const session = await service.completeSession('user-a');
      expect(session.status).toBe('completed');
      expect(mockBehaviorEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          eventType: 'daily_growth.completed',
        }),
      );
    });
  });
});
