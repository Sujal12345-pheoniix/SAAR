import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import type { CreateRoutineDto } from './dto/create-routine.dto';
import type { UpdateRoutineDto } from './dto/update-routine.dto';

@Injectable()
export class RoutinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.routine.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id, userId },
    });
    if (!routine) {
      throw new NotFoundException('Routine not found');
    }
    return routine;
  }

  async create(userId: string, dto: CreateRoutineDto) {
    let timezone = dto.timezone;
    if (!timezone) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      timezone = user?.timezone || 'Asia/Kolkata';
    }

    const routine = await this.prisma.routine.create({
      data: {
        userId,
        title: dto.title,
        recurrenceRule: dto.recurrenceRule,
        timezone,
        preferredTime: dto.preferredTime,
        active: dto.active ?? true,
      },
    });

    return routine;
  }

  async update(userId: string, id: string, dto: UpdateRoutineDto) {
    const existing = await this.prisma.routine.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Routine not found');
    }

    const data: Prisma.RoutineUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.recurrenceRule !== undefined) data.recurrenceRule = dto.recurrenceRule;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.preferredTime !== undefined) data.preferredTime = dto.preferredTime;
    if (dto.active !== undefined) data.active = dto.active;

    return this.prisma.routine.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.routine.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Routine not found');
    }

    return this.prisma.routine.delete({
      where: { id },
    });
  }

  async complete(userId: string, id: string) {
    const routine = await this.findOne(userId, id);

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'routine.completed',
      entityType: 'Routine',
      entityId: routine.id,
      metadata: {
        title: routine.title,
        preferredTime: routine.preferredTime,
      },
    });

    return { status: 'success', routineId: routine.id };
  }

  async skip(userId: string, id: string) {
    const routine = await this.findOne(userId, id);

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'routine.skipped',
      entityType: 'Routine',
      entityId: routine.id,
      metadata: {
        title: routine.title,
      },
    });

    return { status: 'skipped', routineId: routine.id };
  }
}
