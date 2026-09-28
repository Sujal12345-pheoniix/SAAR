import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface LogEventParams {
  userId: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  source?: string;
}

export interface GetEventsParams {
  eventType?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class BehaviorEventsService {
  private readonly logger = new Logger(BehaviorEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: LogEventParams) {
    const { userId, eventType, entityType, entityId, metadata = {}, source = 'api' } = params;
    const occurredAt = new Date();
    const jsonMetadata = metadata as unknown as Prisma.InputJsonValue;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.behaviorEvent.create({
          data: {
            userId,
            eventType,
            source,
            entityType,
            entityId,
            metadata: jsonMetadata,
            occurredAt,
            schemaVersion: 1,
          },
        });

        const outboxPayload: Prisma.InputJsonObject = {
          eventId: event.id,
          userId,
          eventType,
          metadata: jsonMetadata,
          occurredAt: occurredAt.toISOString(),
        };

        // Also record to outbox for transactional event publishing
        await tx.outboxEvent.create({
          data: {
            userId,
            eventType,
            aggregateType: entityType ?? 'Unknown',
            aggregateId: entityId ?? event.id,
            payload: outboxPayload,
            status: 'PENDING',
          },
        });

        return event;
      });
    } catch (error) {
      this.logger.error(`Failed to log behavior event: ${eventType}`, error);
      throw error;
    }
  }

  async getEvents(userId: string, params: GetEventsParams = {}) {
    const limit = Math.min(params.limit ?? 50, 200);

    const where: Prisma.BehaviorEventWhereInput = {
      userId,
      ...(params.eventType ? { eventType: params.eventType } : {}),
      ...(params.from || params.to
        ? {
            occurredAt: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
      ...(params.cursor ? { id: { lt: params.cursor } } : {}),
    };

    const events = await this.prisma.behaviorEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = events.length > limit;
    const data = hasMore ? events.slice(0, limit) : events;

    return {
      data,
      page: {
        nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
        hasMore,
      },
    };
  }
}
