import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { INotificationProvider, MockNotificationProvider } from './notification-provider.interface';
import { NotificationJob, NotificationJobSchema } from '../queues/job-contracts';

@Injectable()
export class NotificationWorkerService {
  private readonly logger = new Logger(NotificationWorkerService.name);
  private provider: INotificationProvider = new MockNotificationProvider();

  constructor(private readonly prisma: PrismaService) {}

  setProvider(provider: INotificationProvider): void {
    this.provider = provider;
  }

  getProvider(): INotificationProvider {
    return this.provider;
  }

  /**
   * Process a single notification delivery job idempotently
   */
  async processNotificationJob(rawJob: unknown): Promise<{ processed: boolean; status: string; reason?: string }> {
    // 1. Runtime schema validation
    const parsed = NotificationJobSchema.safeParse(rawJob);
    if (!parsed.success) {
      this.logger.error(`Rejecting invalid notification job payload: ${parsed.error.message}`);
      return { processed: false, status: 'REJECTED_INVALID_PAYLOAD', reason: parsed.error.message };
    }

    const job: NotificationJob = parsed.data;

    // 2. Idempotency check against database
    const notification = await this.prisma.notification.findUnique({
      where: { id: job.notificationId },
      include: { user: { include: { profile: true, devices: true } } },
    });

    if (!notification) {
      this.logger.warn(`Notification ${job.notificationId} not found in database. Skipping.`);
      return { processed: false, status: 'NOT_FOUND' };
    }

    if (notification.status === 'SENT') {
      this.logger.log(`Notification ${job.notificationId} already delivered (idempotent skip).`);
      return { processed: true, status: 'ALREADY_SENT' };
    }

    if (notification.status === 'CANCELLED') {
      this.logger.log(`Notification ${job.notificationId} was cancelled by user. Skipping.`);
      return { processed: true, status: 'CANCELLED' };
    }

    // 3. User quiet hours & preference validation
    const user = notification.user;
    const isQuietHour = this.checkQuietHours(user.timezone);
    if (isQuietHour && job.type !== 'ALARM') {
      this.logger.log(`Notification ${job.notificationId} postponed: currently quiet hours in ${user.timezone}`);
      return { processed: false, status: 'DEFERRED_QUIET_HOURS' };
    }

    // 4. Collect registered device push tokens
    const activeTokens = user.devices
      .map((d) => d.pushTokenHash)
      .filter((token): token is string => Boolean(token));

    // 5. Dispatch via provider abstraction
    try {
      const result = await this.provider.send({
        notificationId: notification.id,
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        channel: job.channel,
        deviceTokens: activeTokens,
        metadata: job.metadata,
      });

      if (result.success) {
        // Update database delivery status
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        // Cleanup any stale/invalid device tokens reported by provider
        if (result.invalidTokens && result.invalidTokens.length > 0) {
          await this.prisma.device.deleteMany({
            where: {
              userId: user.id,
              pushTokenHash: { in: result.invalidTokens },
            },
          });
        }

        this.logger.log(`Notification ${notification.id} delivered successfully via ${result.provider}`);
        return { processed: true, status: 'SENT' };
      } else {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: result.error ?? 'Provider delivery failure',
          },
        });
        return { processed: false, status: 'FAILED', reason: result.error };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: errorMsg,
        },
      });
      this.logger.error(`Exception delivering notification ${notification.id}: ${errorMsg}`);
      throw err; // Re-throw to trigger BullMQ retry policy if transient
    }
  }

  /**
   * Evaluates if current time is within user quiet hours (e.g. 22:00 to 07:00 user time)
   */
  private checkQuietHours(timezone: string): boolean {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hourCycle: 'h23',
      });
      const hour = parseInt(formatter.format(new Date()), 10);
      return hour >= 23 || hour < 6;
    } catch {
      return false;
    }
  }
}
