import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RoutineOccurrenceJob, RoutineOccurrenceJobSchema } from '../queues/job-contracts';

@Injectable()
export class RoutineOccurrenceGeneratorService {
  private readonly logger = new Logger(RoutineOccurrenceGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a daily routine occurrence record idempotently
   */
  async generateOccurrence(rawJob: unknown): Promise<{ occurrenceId: string; isNew: boolean }> {
    const parsed = RoutineOccurrenceJobSchema.safeParse(rawJob);
    if (!parsed.success) {
      throw new Error(`Invalid routine occurrence job payload: ${parsed.error.message}`);
    }

    const job: RoutineOccurrenceJob = parsed.data;
    const { routineId, userId, localDate, expectedAt } = job;
    const calendarDate = new Date(`${localDate}T00:00:00.000Z`);
    const expectedTime = new Date(expectedAt);

    // 1. Idempotency Check: Query unique constraint [routineId, localDate]
    const existing = await this.prisma.routineOccurrence.findUnique({
      where: {
        routineId_localDate: {
          routineId,
          localDate: calendarDate,
        },
      },
    });

    if (existing) {
      this.logger.log(`Occurrence for routine ${routineId} on ${localDate} already exists (${existing.id}). Idempotent skip.`);
      return { occurrenceId: existing.id, isNew: false };
    }

    // 2. Insert new occurrence
    const created = await this.prisma.routineOccurrence.create({
      data: {
        routineId,
        userId,
        localDate: calendarDate,
        expectedAt: expectedTime,
        status: 'PENDING',
      },
    });

    this.logger.log(`Created routine occurrence ${created.id} for routine ${routineId} on ${localDate}`);
    return { occurrenceId: created.id, isNew: true };
  }
}
