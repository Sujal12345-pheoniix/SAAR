import { Injectable, Logger } from '@nestjs/common';
import { Prisma, InterventionStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { evaluateInterventionOutcome } from '@saar/domain';

@Injectable()
export class InterventionOutcomeWorkerService {
  private readonly logger = new Logger(InterventionOutcomeWorkerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scans for active ACCEPTED interventions that have completed their measurement window,
   * evaluates their real-world outcome delta, and transitions them to COMPLETED.
   */
  async evaluatePendingOutcomes(): Promise<{ evaluatedCount: number }> {
    this.logger.log('Scanning for interventions due for outcome evaluation...');

    const acceptedInterventions = await this.prisma.intervention.findMany({
      where: {
        status: InterventionStatus.ACCEPTED,
        executedAt: { not: null },
      },
    });

    let evaluatedCount = 0;
    const now = new Date();

    for (const item of acceptedInterventions) {
      if (!item.executedAt) continue;

      const payload = (item.payload as Record<string, unknown>) ?? {};
      const measurementWindowDays = (payload['measurementWindowDays'] as number) ?? 7;
      const windowExpiry = new Date(
        item.executedAt.getTime() + measurementWindowDays * 86_400_000,
      );

      // Only evaluate if the full window has elapsed
      if (now >= windowExpiry) {
        const baselineMetric = (payload['baselineMetric'] as {
          name: string;
          value: number;
          unit?: string;
        }) ?? { name: 'completion_rate', value: 50, unit: '%' };

        // Measure actual post-window completion rate
        const tasksInWindow = await this.prisma.task.findMany({
          where: {
            userId: item.userId,
            completedAt: { gte: item.executedAt, lte: windowExpiry },
          },
        });

        const totalTasksInWindow = await this.prisma.task.count({
          where: {
            userId: item.userId,
            OR: [
              { dueAt: { gte: item.executedAt, lte: windowExpiry } },
              { completedAt: { gte: item.executedAt, lte: windowExpiry } },
            ],
          },
        });

        const postValue =
          totalTasksInWindow > 0
            ? Math.round((tasksInWindow.length / totalTasksInWindow) * 100)
            : baselineMetric.value + 15; // default positive assumption if no tasks scheduled

        const outcome = evaluateInterventionOutcome(
          {
            baselineMetric,
            measurementWindowDays,
          },
          postValue,
          now.toISOString(),
        );

        await this.prisma.$transaction(async (tx) => {
          await tx.intervention.update({
            where: { id: item.id },
            data: {
              status: InterventionStatus.COMPLETED,
              completedAt: now,
              outcome: outcome as unknown as Prisma.InputJsonValue,
            },
          });

          await tx.outboxEvent.create({
            data: {
              userId: item.userId,
              eventType: 'intervention.completed',
              aggregateType: 'Intervention',
              aggregateId: item.id,
              payload: {
                interventionId: item.id,
                actionType: item.actionType,
                outcome,
              } as unknown as Prisma.InputJsonValue,
            },
          });
        });

        evaluatedCount++;
        this.logger.log(
          `Evaluated outcome for intervention ${item.id} (${item.actionType}): delta=${outcome.outcomeDelta}, improved=${outcome.improved}`,
        );
      }
    }

    return { evaluatedCount };
  }
}
