import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MaintenanceWorkerService {
  private readonly logger = new Logger(MaintenanceWorkerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Purge expired sessions older than retention boundary (e.g. 30 days past expiry)
   */
  async cleanupExpiredSessions(retentionDays = 30): Promise<{ deletedCount: number }> {
    const threshold = new Date(Date.now() - retentionDays * 86400000);
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: threshold },
      },
    });

    this.logger.log(`Maintenance: Purged ${result.count} expired sessions older than ${retentionDays} days`);
    return { deletedCount: result.count };
  }

  /**
   * Prune successfully processed outbox events older than retention boundary (e.g. 7 days)
   */
  async pruneProcessedOutboxEvents(retentionDays = 7): Promise<{ deletedCount: number }> {
    const threshold = new Date(Date.now() - retentionDays * 86400000);
    const result = await this.prisma.outboxEvent.deleteMany({
      where: {
        status: 'PROCESSED',
        processedAt: { lt: threshold },
      },
    });

    this.logger.log(`Maintenance: Pruned ${result.count} processed outbox events older than ${retentionDays} days`);
    return { deletedCount: result.count };
  }
}
