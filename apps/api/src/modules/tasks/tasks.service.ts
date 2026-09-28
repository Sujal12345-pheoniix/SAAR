import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TaskStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';

// Valid task state transitions
const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.CANCELLED, TaskStatus.TODO],
  [TaskStatus.COMPLETED]: [], // terminal — no transitions except via reschedule
  [TaskStatus.SKIPPED]: [TaskStatus.TODO, TaskStatus.RESCHEDULED], // can re-activate
  [TaskStatus.CANCELLED]: [TaskStatus.TODO], // can re-activate
  [TaskStatus.RESCHEDULED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.CANCELLED],
};

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
      planId?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = Math.min(filter?.limit ?? 20, 100);
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.goalId ? { goalId: filter.goalId } : {}),
        ...(filter?.lifeAreaId ? { lifeAreaId: filter.lifeAreaId } : {}),
        ...(filter?.planId ? { planId: filter.planId } : {}),
        ...(filter?.cursor ? { id: { lt: filter.cursor } } : {}),
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
      orderBy: [{ dueAt: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }],
      take: limit + 1,
    });

    const hasMore = tasks.length > limit;
    const data = hasMore ? tasks.slice(0, limit) : tasks;
    return {
      data,
      page: {
        nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
        plan: { select: { id: true, localDate: true } },
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

    if (dto.planId) {
      const plan = await this.prisma.plan.findFirst({
        where: { id: dto.planId, userId },
      });
      if (!plan) {
        throw new NotFoundException('Plan not found');
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
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        originalDueAt: dto.dueAt ? new Date(dto.dueAt) : null,
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

    // Validate state transition if status is changing
    if (dto.status !== undefined && dto.status !== existing.status) {
      const allowed = TASK_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition task from ${existing.status} to ${dto.status}`,
        );
      }
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
    if (dto.actualDurationMinutes !== undefined) data.actualDurationMinutes = dto.actualDurationMinutes;
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
      } else if (dto.status === TaskStatus.IN_PROGRESS && !existing.startedAt) {
        data.startedAt = new Date();
      } else if (dto.status === TaskStatus.SKIPPED && !existing.skippedAt) {
        data.skippedAt = new Date();
        if (dto.skipReason) data.skipReason = dto.skipReason;
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
        metadata: { title: updated.title, skipReason: dto.skipReason },
      });
    }

    return updated;
  }

  async start(userId: string, id: string) {
    const existing = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Task not found');

    if (existing.status === TaskStatus.IN_PROGRESS) {
      return existing; // idempotent
    }

    const allowed = TASK_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(TaskStatus.IN_PROGRESS)) {
      throw new BadRequestException(
        `Cannot start task in status ${existing.status}`,
      );
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });
  }

  async complete(userId: string, id: string) {
    const existing = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Task not found');

    if (existing.status === TaskStatus.COMPLETED) {
      return existing; // idempotent
    }

    const allowed = TASK_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(TaskStatus.COMPLETED)) {
      throw new BadRequestException(
        `Cannot complete task in status ${existing.status}`,
      );
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        startedAt: existing.startedAt ?? new Date(),
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

  async skip(userId: string, id: string, reason?: string) {
    const existing = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Task not found');

    if (existing.status === TaskStatus.SKIPPED) return existing; // idempotent

    const allowed = TASK_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(TaskStatus.SKIPPED)) {
      throw new BadRequestException(
        `Cannot skip task in status ${existing.status}`,
      );
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.SKIPPED,
        skippedAt: new Date(),
        ...(reason ? { skipReason: reason } : {}),
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
      metadata: { title: updated.title, skipReason: reason },
    });

    return updated;
  }

  async cancel(userId: string, id: string, reason?: string) {
    const existing = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Task not found');

    if (existing.status === TaskStatus.CANCELLED) return existing; // idempotent

    const allowed = TASK_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(TaskStatus.CANCELLED)) {
      throw new BadRequestException(
        `Cannot cancel task in status ${existing.status}`,
      );
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.CANCELLED,
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'task.cancelled',
      entityType: 'Task',
      entityId: updated.id,
      metadata: { title: updated.title, reason },
    });

    return updated;
  }

  async reschedule(userId: string, id: string, dueAt: string, reason?: string) {
    const existing = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Task not found');

    const newDueDate = new Date(dueAt);
    const newStatus =
      existing.status === TaskStatus.COMPLETED
        ? TaskStatus.COMPLETED
        : existing.status === TaskStatus.CANCELLED
          ? TaskStatus.TODO
          : TaskStatus.RESCHEDULED;

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        dueAt: newDueDate,
        rescheduledAt: new Date(),
        rescheduleCount: { increment: 1 },
        status: newStatus,
        ...(reason ? { rescheduleReason: reason } : {}),
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
        reason,
      },
    });

    return updated;
  }
}
