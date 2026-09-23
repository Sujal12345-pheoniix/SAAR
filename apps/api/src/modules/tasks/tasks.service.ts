import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
  ) {}

  async findAll(
    userId: string,
    filter?: {
      status?: TaskStatus;
      goalId?: string;
      lifeAreaId?: string;
    },
  ) {
    return this.prisma.task.findMany({
      where: {
        userId,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.goalId ? { goalId: filter.goalId } : {}),
        ...(filter?.lifeAreaId ? { lifeAreaId: filter.lifeAreaId } : {}),
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
      orderBy: [{ dueAt: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    let resolvedLifeAreaId = dto.lifeAreaId;

    if (dto.goalId) {
      const goal = await this.prisma.goal.findFirst({
        where: { id: dto.goalId, userId },
      });
      if (!goal) {
        throw new NotFoundException('Goal not found');
      }
      if (!resolvedLifeAreaId && goal.lifeAreaId) {
        resolvedLifeAreaId = goal.lifeAreaId;
      }
    }

    if (resolvedLifeAreaId) {
      const lifeArea = await this.prisma.lifeArea.findFirst({
        where: { id: resolvedLifeAreaId, userId },
      });
      if (!lifeArea) {
        throw new NotFoundException('Life area not found');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        goalId: dto.goalId,
        lifeAreaId: resolvedLifeAreaId,
        planId: dto.planId,
        priority: dto.priority ?? 3,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        estimatedMinutes: dto.estimatedMinutes,
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'task.created',
      entityType: 'Task',
      entityId: task.id,
      metadata: {
        title: task.title,
        priority: task.priority,
        goalId: task.goalId,
        lifeAreaId: task.lifeAreaId,
      },
    });

    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    if (dto.goalId) {
      const goal = await this.prisma.goal.findFirst({
        where: { id: dto.goalId, userId },
      });
      if (!goal) {
        throw new NotFoundException('Goal not found');
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

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.estimatedMinutes !== undefined) data.estimatedMinutes = dto.estimatedMinutes;
    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }
    if (dto.goalId !== undefined) {
      data.goal = dto.goalId ? { connect: { id: dto.goalId } } : { disconnect: true };
    }
    if (dto.lifeAreaId !== undefined) {
      data.lifeArea = dto.lifeAreaId
        ? { connect: { id: dto.lifeAreaId } }
        : { disconnect: true };
    }
    if (dto.planId !== undefined) {
      data.plan = dto.planId ? { connect: { id: dto.planId } } : { disconnect: true };
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === TaskStatus.COMPLETED && !existing.completedAt) {
        data.completedAt = new Date();
      } else if (dto.status !== TaskStatus.COMPLETED) {
        data.completedAt = null;
      }
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    if (dto.status === TaskStatus.COMPLETED && existing.status !== TaskStatus.COMPLETED) {
      await this.behaviorEvents.logEvent({
        userId,
        eventType: 'task.completed',
        entityType: 'Task',
        entityId: updated.id,
        metadata: { title: updated.title },
      });
    } else if (dto.status === TaskStatus.SKIPPED && existing.status !== TaskStatus.SKIPPED) {
      await this.behaviorEvents.logEvent({
        userId,
        eventType: 'task.skipped',
        entityType: 'Task',
        entityId: updated.id,
        metadata: { title: updated.title },
      });
    }

    return updated;
  }

  async complete(userId: string, id: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'task.completed',
      entityType: 'Task',
      entityId: updated.id,
      metadata: { title: updated.title, completedAt: updated.completedAt },
    });

    return updated;
  }

  async skip(userId: string, id: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.SKIPPED,
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'task.skipped',
      entityType: 'Task',
      entityId: updated.id,
      metadata: { title: updated.title },
    });

    return updated;
  }

  async reschedule(userId: string, id: string, dueAt: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const newDueDate = new Date(dueAt);

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        dueAt: newDueDate,
        // If task was skipped or cancelled, moving date back to future resets to TODO
        status:
          existing.status === TaskStatus.SKIPPED || existing.status === TaskStatus.CANCELLED
            ? TaskStatus.TODO
            : existing.status,
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'task.rescheduled',
      entityType: 'Task',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        oldDueAt: existing.dueAt,
        newDueAt: updated.dueAt,
      },
    });

    return updated;
  }
}
