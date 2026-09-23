import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import type { CreateGoalDto } from './dto/create-goal.dto';
import type { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
  ) {}

  async findAll(userId: string, status?: GoalStatus, lifeAreaId?: string) {
    return this.prisma.goal.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
        ...(lifeAreaId ? { lifeAreaId } : {}),
      },
      include: {
        lifeArea: true,
        metrics: true,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
      include: {
        lifeArea: true,
        metrics: true,
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
          lifeArea: true,
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
          lifeArea: true,
          metrics: true,
        },
      });
    });

    const eventType =
      dto.status === GoalStatus.COMPLETED ? 'goal.completed' : 'goal.updated';

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
        lifeArea: true,
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
}
