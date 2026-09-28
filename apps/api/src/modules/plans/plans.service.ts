import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';

export interface CreatePlanDto {
  localDate?: string;
  generatedBy?: 'user' | 'system' | 'ai';
}

export interface UpdatePlanDto {
  generatedBy?: 'user' | 'system' | 'ai';
}

export interface AddTaskToPlanDto {
  taskId: string;
  order?: number;
}

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
  ) {}

  private getTodayLocalDate(timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  }

  async getTodayPlan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone ?? 'Asia/Kolkata';
    const todayStr = this.getTodayLocalDate(tz);

    return this.getOrCreatePlan(userId, todayStr);
  }

  async getOrCreatePlan(userId: string, localDate: string) {
    const date = new Date(localDate);

    // Look for existing ACTIVE plan
    let plan = await this.prisma.plan.findFirst({
      where: {
        userId,
        localDate: date,
        status: 'ACTIVE',
      },
      include: {
        tasks: {
          include: {
            goal: { select: { id: true, title: true } },
            lifeArea: { select: { id: true, title: true, type: true } },
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!plan) {
      // Find max version for this date
      const latestPlan = await this.prisma.plan.findFirst({
        where: { userId, localDate: date },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (latestPlan?.version ?? 0) + 1;

      plan = await this.prisma.plan.create({
        data: {
          userId,
          localDate: date,
          generatedBy: 'user',
          version: nextVersion,
          status: 'ACTIVE',
        },
        include: {
          tasks: {
            include: {
              goal: { select: { id: true, title: true } },
              lifeArea: { select: { id: true, title: true, type: true } },
            },
            orderBy: { priority: 'asc' },
          },
        },
      });
    }

    return plan;
  }

  async findAll(
    userId: string,
    options?: { cursor?: string; limit?: number },
  ) {
    const limit = Math.min(options?.limit ?? 14, 100);
    const plans = await this.prisma.plan.findMany({
      where: {
        userId,
        ...(options?.cursor ? { id: { lt: options.cursor } } : {}),
      },
      include: {
        tasks: {
          select: { id: true, title: true, status: true, priority: true },
          orderBy: { priority: 'asc' },
        },
      },
      orderBy: { localDate: 'desc' },
      take: limit + 1,
    });

    const hasMore = plans.length > limit;
    const data = hasMore ? plans.slice(0, limit) : plans;
    return {
      data,
      page: {
        nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, userId },
      include: {
        tasks: {
          include: {
            goal: { select: { id: true, title: true } },
            lifeArea: { select: { id: true, title: true, type: true } },
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(userId: string, dto: CreatePlanDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone ?? 'Asia/Kolkata';
    const localDateStr = dto.localDate ?? this.getTodayLocalDate(tz);
    const localDate = new Date(localDateStr);

    // Supersede any existing ACTIVE plans for this date
    await this.prisma.plan.updateMany({
      where: { userId, localDate, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED' },
    });

    const latestPlan = await this.prisma.plan.findFirst({
      where: { userId, localDate },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestPlan?.version ?? 0) + 1;

    return this.prisma.plan.create({
      data: {
        userId,
        localDate,
        generatedBy: dto.generatedBy ?? 'user',
        version: nextVersion,
        status: 'ACTIVE',
      },
      include: {
        tasks: {
          include: {
            goal: { select: { id: true, title: true } },
            lifeArea: { select: { id: true, title: true, type: true } },
          },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findFirst({ where: { id, userId } });
    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.generatedBy !== undefined ? { generatedBy: dto.generatedBy } : {}),
      },
      include: {
        tasks: {
          include: {
            goal: { select: { id: true, title: true } },
            lifeArea: { select: { id: true, title: true, type: true } },
          },
        },
      },
    });
  }

  async addTask(userId: string, planId: string, dto: AddTaskToPlanDto) {
    const plan = await this.prisma.plan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const task = await this.prisma.task.findFirst({ where: { id: dto.taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');

    // Link task to plan
    const updated = await this.prisma.task.update({
      where: { id: dto.taskId },
      data: {
        planId,
        ...(dto.order !== undefined ? { priority: dto.order } : {}),
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    return updated;
  }

  async removeTask(userId: string, planId: string, taskId: string) {
    const plan = await this.prisma.plan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const task = await this.prisma.task.findFirst({ where: { id: taskId, userId, planId } });
    if (!task) throw new NotFoundException('Task not found in this plan');

    return this.prisma.task.update({
      where: { id: taskId },
      data: { planId: null },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });
  }

  async reorderTasks(
    userId: string,
    planId: string,
    taskOrders: Array<{ taskId: string; order: number }>,
  ) {
    const plan = await this.prisma.plan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // Verify all tasks belong to this user and plan
    const taskIds = taskOrders.map((t) => t.taskId);
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds }, userId, planId },
    });

    if (tasks.length !== taskIds.length) {
      throw new BadRequestException('Some tasks do not belong to this plan');
    }

    // Update priorities
    await Promise.all(
      taskOrders.map(({ taskId, order }) =>
        this.prisma.task.update({
          where: { id: taskId },
          data: { priority: order },
        }),
      ),
    );

    return this.findOne(userId, planId);
  }
}
