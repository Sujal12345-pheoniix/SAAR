import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface LogEventParams {
  userId: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  source?: string;
}

@Injectable()
export class BehaviorEventsService {
  private readonly logger = new Logger(BehaviorEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: LogEventParams) {
    const { userId, eventType, entityType, entityId, metadata = {}, source = 'api' } = params;
    const occurredAt = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.behaviorEvent.create({
          data: {
            userId,
            eventType,
            source,
            entityType,
            entityId,
            metadata: metadata as any,
            occurredAt,
            schemaVersion: 1,
          },
        });

        // Also record to outbox for transactional event publishing
        await tx.outboxEvent.create({
          data: {
            userId,
            eventType,
            aggregateType: entityType ?? 'Unknown',
            aggregateId: entityId ?? event.id,
            payload: {
              eventId: event.id,
              userId,
              eventType,
              metadata,
              occurredAt: occurredAt.toISOString(),
            },
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

  async getEvents(userId: string, limit = 50, eventType?: string) {
    return this.prisma.behaviorEvent.findMany({
      where: {
        userId,
        ...(eventType ? { eventType } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }
}
