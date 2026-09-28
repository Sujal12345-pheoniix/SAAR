import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OUTBOX_CONFIG } from '../queues/queue.constants';

export interface OutboxRow {
  id: string;
  userId: string | null;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  availableAt: Date;
  processedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private isRunning = false;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.startPolling();
  }

  onModuleDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('Starting transactional Outbox poller loop');
    this.scheduleNextPoll(100);
  }

  stopPolling(): void {
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    this.logger.log('Stopped transactional Outbox poller loop');
  }

  private scheduleNextPoll(delayMs: number = OUTBOX_CONFIG.POLL_INTERVAL_MS): void {
    if (!this.isRunning) return;
    this.pollTimeout = setTimeout(() => {
      void (async () => {
        try {
          await this.pollAndPublishBatch();
        } catch (err) {
          this.logger.error('Error during Outbox polling cycle', err);
        } finally {
          this.scheduleNextPoll();
        }
      })();
    }, delayMs);
  }

  /**
   * Safe claiming with SELECT FOR UPDATE SKIP LOCKED
   * Guarantees atomic, contention-free event claiming across multiple worker replicas.
   */
  async claimPendingEvents(limit: number = OUTBOX_CONFIG.BATCH_SIZE): Promise<OutboxRow[]> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Atomically lock and claim pending events ready for processing
      const claimed = await tx.$queryRaw<OutboxRow[]>`
        UPDATE "outbox_events"
        SET "status" = 'PROCESSING',
            "attempts" = "attempts" + 1
        WHERE "id" IN (
          SELECT "id"
          FROM "outbox_events"
          WHERE "status" = 'PENDING'
            AND "availableAt" <= NOW()
          ORDER BY "createdAt" ASC
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *;
      `;

      return claimed;
    });
  }

  /**
   * Main publishing loop: claims a batch, dispatches, and updates states
   */
  async pollAndPublishBatch(): Promise<number> {
    const events = await this.claimPendingEvents();
    if (!events || events.length === 0) {
      return 0;
    }

    this.logger.log(`Claimed ${events.length} outbox events for publication`);

    for (const event of events) {
      await this.processSingleOutboxEvent(event);
    }

    return events.length;
  }

  /**
   * Dispatches event to downstream queue or handler
   */
  async processSingleOutboxEvent(event: OutboxRow): Promise<void> {
    try {
      // Execute dispatch logic (routing to domain handler or queue)
      await this.dispatchToConsumer(event);

      // On success: transition to PROCESSED
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
      this.logger.log(`Outbox event ${event.id} (${event.eventType}) successfully marked PROCESSED`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const nextAttempt = event.attempts + 1;
      const isDeadLetter = nextAttempt >= OUTBOX_CONFIG.MAX_ATTEMPTS;

      // Exponential backoff delay: 2^attempts * 1000ms
      const backoffMs = Math.min(Math.pow(2, event.attempts) * 1000, 60000);
      const nextAvailableAt = new Date(Date.now() + backoffMs);

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: isDeadLetter ? 'DEAD_LETTER' : 'PENDING',
          availableAt: isDeadLetter ? new Date() : nextAvailableAt,
          payload: {
            ...(typeof event.payload === 'object' && event.payload !== null ? event.payload : {}),
            lastError: errorMsg,
            failedAt: new Date().toISOString(),
          },
        },
      });

      if (isDeadLetter) {
        this.logger.error(`Outbox event ${event.id} permanently failed after ${OUTBOX_CONFIG.MAX_ATTEMPTS} attempts -> Moved to DEAD_LETTER`);
      } else {
        this.logger.warn(`Outbox event ${event.id} transiently failed. Retry scheduled at ${nextAvailableAt.toISOString()}: ${errorMsg}`);
      }
    }
  }

  /**
   * Event dispatcher routing based on eventType and aggregate
   */
  private dispatchToConsumer(event: OutboxRow): Promise<void> {
    // In Part 2C: Dispatches to internal consumers or queues
    // Validates idempotency and event payload
    if (!event.eventType) {
      return Promise.reject(new Error(`Invalid outbox event: missing eventType on ${event.id}`));
    }
    return Promise.resolve();
  }
}
