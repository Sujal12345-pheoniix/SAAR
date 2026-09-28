import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DailyGrowthJob, DailyGrowthJobSchema } from '../queues/job-contracts';

@Injectable()
export class DailyPlanGeneratorService {
  private readonly logger = new Logger(DailyPlanGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministically generates or refreshes the daily plan for a user on their local date
   */
  async generateDailyPlan(rawJob: unknown): Promise<{ planId: string; taskCount: number; isNew: boolean }> {
    const parsed = DailyGrowthJobSchema.safeParse(rawJob);
    if (!parsed.success) {
      throw new Error(`Invalid daily growth job payload: ${parsed.error.message}`);
    }

    const job: DailyGrowthJob = parsed.data;
    const { userId, localDate, forceRegenerate } = job;
    const planDate = new Date(`${localDate}T00:00:00.000Z`);

    // 1. Check if an active plan already exists for this user and local date (Idempotency)
    const existingPlan = await this.prisma.plan.findFirst({
      where: {
        userId,
        localDate: planDate,
        status: 'ACTIVE',
      },
      include: { tasks: true },
    });

    if (existingPlan && !forceRegenerate) {
      this.logger.log(`Active plan for user ${userId} on ${localDate} already exists (${existingPlan.id}). Idempotent skip.`);
      return { planId: existingPlan.id, taskCount: existingPlan.tasks.length, isNew: false };
    }

    // 2. Fetch pending tasks scheduled for today or overdue
    const pendingTasks = await this.prisma.task.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS', 'RESCHEDULED'] },
      },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
      take: 10,
    });

    // 3. Atomically upsert the plan and link tasks
    const plan = await this.prisma.$transaction(async (tx) => {
      let activePlan = existingPlan;
      if (!activePlan) {
        activePlan = await tx.plan.create({
          data: {
            userId,
            localDate: planDate,
            generatedBy: 'system',
            version: 1,
            status: 'ACTIVE',
          },
          include: { tasks: true },
        });
      }

      // Link pending tasks to this plan
      if (pendingTasks.length > 0) {
        await tx.task.updateMany({
          where: {
            id: { in: pendingTasks.map((t) => t.id) },
          },
          data: {
            planId: activePlan.id,
          },
        });
      }

      return activePlan;
    });

    this.logger.log(`Daily plan ${plan.id} ready for user ${userId} on ${localDate} with ${pendingTasks.length} tasks`);
    return { planId: plan.id, taskCount: pendingTasks.length, isNew: !existingPlan };
  }
}
