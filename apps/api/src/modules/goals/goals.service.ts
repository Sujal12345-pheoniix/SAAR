import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GoalStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import type { CreateGoalDto } from './dto/create-goal.dto';
import type { UpdateGoalDto } from './dto/update-goal.dto';

// Valid status transitions
const GOAL_TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  [GoalStatus.ACTIVE]: [GoalStatus.COMPLETED, GoalStatus.PAUSED, GoalStatus.ARCHIVED],
  [GoalStatus.PAUSED]: [GoalStatus.ACTIVE, GoalStatus.ARCHIVED],
  [GoalStatus.COMPLETED]: [GoalStatus.ACTIVE], // reopen
  [GoalStatus.ARCHIVED]: [GoalStatus.ACTIVE], // unarchive
};

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
  ) {}

  async findAll(
    userId: string,
    options?: { status?: GoalStatus; lifeAreaId?: string; cursor?: string; limit?: number },
  ) {
    const limit = Math.min(options?.limit ?? 20, 100);
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.lifeAreaId ? { lifeAreaId: options.lifeAreaId } : {}),
        ...(options?.cursor ? { id: { lt: options.cursor } } : {}),
      },
      include: {
        lifeArea: { select: { id: true, title: true, type: true } },
        metrics: true,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      take: limit + 1,
    });

    const hasMore = goals.length > limit;
    const data = hasMore ? goals.slice(0, limit) : goals;
    return {
      data,
      page: {
        nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
      include: {
        lifeArea: { select: { id: true, title: true, type: true } },
        metrics: {
          include: {
            observations: {
              orderBy: { observedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async create(userId: string, dto: CreateGoalDto) {
    if (dto.lifeAreaId) {
      const lifeArea = await this.prisma.lifeArea.findFirst({
        where: { id: dto.lifeAreaId, userId },
      });
      if (!lifeArea) {
        throw new NotFoundException('Life area not found');
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          userId,
          title: dto.title,
          description: dto.description,
          reason: dto.reason,
          lifeAreaId: dto.lifeAreaId,
          priority: dto.priority ?? 3,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
          metrics: dto.metrics?.length
            ? {
                create: dto.metrics.map((m) => ({
                  metricType: m.metricType,
                  targetValue: m.targetValue !== undefined ? m.targetValue : null,
                  currentValue: m.currentValue !== undefined ? m.currentValue : null,
                  unit: m.unit,
                })),
              }
            : undefined,
        },
        include: {
          lifeArea: { select: { id: true, title: true, type: true } },
          metrics: true,
        },
      });

      return goal;
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'goal.created',
      entityType: 'Goal',
      entityId: created.id,
      metadata: { title: created.title, priority: created.priority },
    });

    return created;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.prisma.goal.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    // Validate status transition if status is changing
    if (dto.status !== undefined && dto.status !== existing.status) {
      const allowed = GOAL_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition goal from ${existing.status} to ${dto.status}`,
        );
      }
    }

    if (dto.lifeAreaId) {
      const lifeArea = await this.prisma.lifeArea.findFirst({
        where: { id: dto.lifeAreaId, userId },
      });
      if (!lifeArea) {
        throw new NotFoundException('Life area not found');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.GoalUpdateInput = {};
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.reason !== undefined) data.reason = dto.reason;
      if (dto.priority !== undefined) data.priority = dto.priority;
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.targetDate !== undefined) {
        data.targetDate = dto.targetDate ? new Date(dto.targetDate) : null;
      }
      if (dto.lifeAreaId !== undefined) {
        data.lifeArea = dto.lifeAreaId
          ? { connect: { id: dto.lifeAreaId } }
          : { disconnect: true };
      }

      if (dto.metrics) {
        await tx.goalMetric.deleteMany({ where: { goalId: id } });
        if (dto.metrics.length > 0) {
          await tx.goalMetric.createMany({
            data: dto.metrics.map((m) => ({
              goalId: id,
              metricType: m.metricType,
              targetValue: m.targetValue !== undefined ? m.targetValue : null,
              currentValue: m.currentValue !== undefined ? m.currentValue : null,
              unit: m.unit,
            })),
          });
        }
      }

      return tx.goal.update({
        where: { id },
        data,
        include: {
          lifeArea: { select: { id: true, title: true, type: true } },
          metrics: true,
        },
      });
    });

    const eventType =
      dto.status === GoalStatus.COMPLETED
        ? 'goal.completed'
        : dto.status === GoalStatus.ARCHIVED
          ? 'goal.archived'
          : 'goal.updated';

    await this.behaviorEvents.logEvent({
      userId,
      eventType,
      entityType: 'Goal',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        status: updated.status,
      },
    });

    return updated;
  }

  async archive(userId: string, id: string) {
    const existing = await this.prisma.goal.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    const archived = await this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.ARCHIVED },
      include: {
        lifeArea: { select: { id: true, title: true, type: true } },
        metrics: true,
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'goal.updated',
      entityType: 'Goal',
      entityId: archived.id,
      metadata: { action: 'archive', status: archived.status },
    });

    return archived;
  }

  async complete(userId: string, id: string) {
    const existing = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Goal not found');

    if (existing.status === GoalStatus.COMPLETED) {
      return existing; // idempotent
    }

    const allowed = GOAL_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(GoalStatus.COMPLETED)) {
      throw new BadRequestException(
        `Cannot complete goal in status ${existing.status}`,
      );
    }

    const updated = await this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.COMPLETED },
      include: {
        lifeArea: { select: { id: true, title: true, type: true } },
        metrics: true,
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'goal.completed',
      entityType: 'Goal',
      entityId: updated.id,
      metadata: { title: updated.title },
    });

    return updated;
  }

  async reopen(userId: string, id: string) {
    const existing = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Goal not found');

    const allowed = GOAL_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(GoalStatus.ACTIVE)) {
      throw new BadRequestException(
        `Cannot reopen goal in status ${existing.status}`,
      );
    }

    const updated = await this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.ACTIVE },
      include: {
        lifeArea: { select: { id: true, title: true, type: true } },
        metrics: true,
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'goal.updated',
      entityType: 'Goal',
      entityId: updated.id,
      metadata: { action: 'reopen', status: updated.status },
    });

    return updated;
  }

  async pause(userId: string, id: string) {
    const existing = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Goal not found');

    if (existing.status === GoalStatus.PAUSED) return existing; // idempotent

    const allowed = GOAL_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(GoalStatus.PAUSED)) {
      throw new BadRequestException(
        `Cannot pause goal in status ${existing.status}`,
      );
    }

    const updated = await this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.PAUSED },
      include: {
        lifeArea: { select: { id: true, title: true, type: true } },
        metrics: true,
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'goal.updated',
      entityType: 'Goal',
      entityId: updated.id,
      metadata: { action: 'pause', status: updated.status },
    });

    return updated;
  }

  // ── GoalMetrics ──────────────────────────────────────────────────────────────

  async createMetric(
    userId: string,
    goalId: string,
    dto: { metricType: string; targetValue?: number; currentValue?: number; unit?: string },
  ) {
    // Verify goal belongs to user
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    return this.prisma.goalMetric.create({
      data: {
        goalId,
        metricType: dto.metricType,
        targetValue: dto.targetValue ?? null,
        currentValue: dto.currentValue ?? null,
        unit: dto.unit ?? null,
      },
    });
  }

  async updateMetric(
    userId: string,
    goalId: string,
    metricId: string,
    dto: { metricType?: string; targetValue?: number; currentValue?: number; unit?: string },
  ) {
    // Verify goal belongs to user
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const metric = await this.prisma.goalMetric.findFirst({ where: { id: metricId, goalId } });
    if (!metric) throw new NotFoundException('Metric not found');

    return this.prisma.goalMetric.update({
      where: { id: metricId },
      data: {
        ...(dto.metricType !== undefined ? { metricType: dto.metricType } : {}),
        ...(dto.targetValue !== undefined ? { targetValue: dto.targetValue } : {}),
        ...(dto.currentValue !== undefined ? { currentValue: dto.currentValue } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
      },
    });
  }

  async deleteMetric(userId: string, goalId: string, metricId: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const metric = await this.prisma.goalMetric.findFirst({ where: { id: metricId, goalId } });
    if (!metric) throw new NotFoundException('Metric not found');

    return this.prisma.goalMetric.delete({ where: { id: metricId } });
  }

  // ── MetricObservations ───────────────────────────────────────────────────────

  async recordObservation(
    userId: string,
    goalId: string,
    metricId: string,
    dto: { value: number; observedAt?: string; source?: string; unit?: string; metadata?: Record<string, unknown> },
  ) {
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const metric = await this.prisma.goalMetric.findFirst({ where: { id: metricId, goalId } });
    if (!metric) throw new NotFoundException('Metric not found');

    return this.prisma.$transaction(async (tx) => {
      const observation = await tx.metricObservation.create({
        data: {
          metricId,
          value: dto.value,
          observedAt: dto.observedAt ? new Date(dto.observedAt) : new Date(),
          source: dto.source ?? 'user',
          unit: dto.unit ?? metric.unit ?? null,
          metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
        },
      });

      // Update metric currentValue
      await tx.goalMetric.update({
        where: { id: metricId },
        data: { currentValue: dto.value },
      });

      return observation;
    });
  }

  async listObservations(
    userId: string,
    goalId: string,
    metricId: string,
    options?: { cursor?: string; limit?: number },
  ) {
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const metric = await this.prisma.goalMetric.findFirst({ where: { id: metricId, goalId } });
    if (!metric) throw new NotFoundException('Metric not found');

    const limit = Math.min(options?.limit ?? 20, 100);
    const observations = await this.prisma.metricObservation.findMany({
      where: {
        metricId,
        ...(options?.cursor ? { id: { lt: options.cursor } } : {}),
      },
      orderBy: { observedAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = observations.length > limit;
    const data = hasMore ? observations.slice(0, limit) : observations;

    return {
      data,
      page: {
        nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async getLatestObservation(userId: string, goalId: string, metricId: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const metric = await this.prisma.goalMetric.findFirst({ where: { id: metricId, goalId } });
    if (!metric) throw new NotFoundException('Metric not found');

    const observation = await this.prisma.metricObservation.findFirst({
      where: { metricId },
      orderBy: { observedAt: 'desc' },
    });

    return observation ?? null;
  }
}
