/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorEventsService } from './behavior-events.service';
import { PrismaService } from '../../database/prisma.service';

describe('BehaviorEventsService (Transactional Outbox & Retrieval)', () => {
  let service: BehaviorEventsService;

  const mockPrisma: any = {
    behaviorEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    outboxEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BehaviorEventsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BehaviorEventsService>(BehaviorEventsService);
    jest.clearAllMocks();
  });

  it('atomically creates BehaviorEvent and OutboxEvent in the same transaction', async () => {
    const createdEvent = {
      id: 'evt-1',
      userId: 'user-a',
      eventType: 'task.completed',
      source: 'api',
      entityType: 'Task',
      entityId: 't-1',
      occurredAt: new Date(),
    };
    mockPrisma.behaviorEvent.create.mockResolvedValueOnce(createdEvent);
    mockPrisma.outboxEvent.create.mockResolvedValueOnce({ id: 'outbox-1' });

    const result = await service.logEvent({
      userId: 'user-a',
      eventType: 'task.completed',
      entityType: 'Task',
      entityId: 't-1',
      metadata: { title: 'Deep Work' },
    });

    expect(result).toEqual(createdEvent);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.behaviorEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-a',
          eventType: 'task.completed',
        }),
      }),
    );
    expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-a',
          eventType: 'task.completed',
          aggregateType: 'Task',
          aggregateId: 't-1',
          status: 'PENDING',
        }),
      }),
    );
  });

  it('retrieves paginated events with optional eventType filter', async () => {
    const eventsList = [
      { id: 'evt-2', eventType: 'task.completed', occurredAt: new Date() },
      { id: 'evt-1', eventType: 'task.completed', occurredAt: new Date() },
    ];
    mockPrisma.behaviorEvent.findMany.mockResolvedValueOnce(eventsList);

    const res = await service.getEvents('user-a', { eventType: 'task.completed', limit: 10 });
    expect(res.data).toHaveLength(2);
    expect(res.page.hasMore).toBe(false);
  });
});
