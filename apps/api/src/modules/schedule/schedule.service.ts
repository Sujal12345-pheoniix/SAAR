import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import { BehaviorAggregatorService } from '../growth-engine/behavior-aggregator.service';
import {
  rankCandidates,
  simulateSchedule,
  calculateScheduleCapacity,
  type ScheduleCandidate,
  type LifeAreaType,
} from '@saar/domain';
import type { SimulateScheduleDto, ApplyScheduleAdaptationDto } from './dto/schedule.dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
    private readonly aggregator: BehaviorAggregatorService,
  ) {}

  private getTodayDateString(timezone: string = 'Asia/Kolkata'): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  }

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone ?? 'Asia/Kolkata';
  }

  /**
   * Evaluates available schedule capacity and returns ranked candidate tasks.
   */
  async getCandidates(userId: string, targetDate?: string) {
    const tz = await this.getUserTimezone(userId);
    const dateStr = targetDate || this.getTodayDateString(tz);

    // Fetch active routines
    const routines = await this.prisma.routine.findMany({
      where: { userId, active: true },
      select: { id: true },
    });

    // Fetch open tasks
    const openTasks = await this.prisma.task.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      include: {
        goal: { select: { id: true, priority: true } },
        lifeArea: { select: { type: true } },
      },
      orderBy: { priority: 'asc' },
    });

    // Fetch feature snapshot for life area distribution
    const snapshot = await this.aggregator.getFeatureSnapshot(userId);

    const candidates: ScheduleCandidate[] = openTasks.map((t) => ({
      id: t.id,
      title: t.title,
      goalId: t.goalId ?? undefined,
      goalPriority: t.goal?.priority ?? t.priority,
      lifeAreaType: (t.lifeArea?.type?.toLowerCase() as LifeAreaType) ?? 'mind',
      dueAt: t.dueAt?.toISOString() ?? undefined,
      estimatedMinutes: t.estimatedMinutes ?? 30,
      rescheduleCount: t.rescheduleCount,
    }));

    const capacity = calculateScheduleCapacity(
      openTasks.map((t) => ({ id: t.id, estimatedMinutes: t.estimatedMinutes })),
      routines.map((r) => ({ id: r.id })),
    );

    const ranked = rankCandidates(candidates, {
      targetDate: dateStr,
      lifeAreaFeatures: snapshot.lifeAreas14d,
    });

    return {
      targetDate: dateStr,
      capacity,
      candidates: ranked,
    };
  }

  /**
   * Deterministically simulates schedule adaptation diffs.
   */
  async simulate(userId: string, dto: SimulateScheduleDto) {
    const tz = await this.getUserTimezone(userId);
    const dateStr = dto.targetDate || this.getTodayDateString(tz);
    const dateObj = new Date(`${dateStr}T00:00:00.000Z`);

    // Fetch active plan
    const activePlan = await this.prisma.plan.findFirst({
      where: {
        userId,
        localDate: dateObj,
        status: 'ACTIVE',
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            dueAt: true,
            estimatedMinutes: true,
          },
        },
      },
    });

    const currentTasks = (activePlan?.tasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      scheduledAt: t.scheduledAt?.toISOString() ?? null,
      dueAt: t.dueAt?.toISOString() ?? null,
      estimatedMinutes: t.estimatedMinutes ?? 30,
    }));

    const simulation = simulateSchedule(
      dto.currentPlanVersion || activePlan?.version || 1,
      currentTasks,
      dto.proposedTasks,
    );

    // Record outbox event for proposed schedule adaptation
    await this.prisma.outboxEvent.create({
      data: {
        userId,
        eventType: 'schedule.adaptation_proposed',
        aggregateType: 'Plan',
        aggregateId: activePlan?.id ?? 'virtual',
        payload: {
          targetDate: dateStr,
          currentVersion: simulation.currentPlanVersion,
          proposedVersion: simulation.proposedPlanVersion,
          summary: simulation.summary,
        } as Prisma.InputJsonValue,
      },
    });

    return simulation;
  }

  /**
   * Applies the simulated schedule adaptation transactionally.
   */
  async apply(userId: string, dto: ApplyScheduleAdaptationDto) {
    const dateObj = new Date(`${dto.targetDate}T00:00:00.000Z`);

    return this.prisma.$transaction(async (tx) => {
      // Find current active plan
      const currentPlan = await tx.plan.findFirst({
        where: { userId, localDate: dateObj, status: 'ACTIVE' },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (currentPlan?.version ?? 0) + 1;

      // Supersede current active plan if exists
      if (currentPlan) {
        await tx.plan.update({
          where: { id: currentPlan.id },
          data: { status: 'SUPERSEDED' },
        });
      }

      // Create new plan version
      const newPlan = await tx.plan.create({
        data: {
          userId,
          localDate: dateObj,
          version: nextVersion,
          status: 'ACTIVE',
          generatedBy: 'system',
        },
      });

      // Re-link and update tasks
      for (const t of dto.finalTasks) {
        await tx.task.update({
          where: { id: t.id },
          data: {
            planId: newPlan.id,
            scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : undefined,
            dueAt: t.dueAt ? new Date(t.dueAt) : undefined,
          },
        });
      }

      // Record outbox event
      await tx.outboxEvent.create({
        data: {
          userId,
          eventType: 'schedule.adaptation_accepted',
          aggregateType: 'Plan',
          aggregateId: newPlan.id,
          payload: {
            planId: newPlan.id,
            targetDate: dto.targetDate,
            version: newPlan.version,
            tasksCount: dto.finalTasks.length,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        planId: newPlan.id,
        version: newPlan.version,
        status: newPlan.status,
        tasksCount: dto.finalTasks.length,
      };
    });
  }
}
