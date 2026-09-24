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
