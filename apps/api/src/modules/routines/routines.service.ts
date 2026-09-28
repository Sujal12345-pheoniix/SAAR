import { Injectable, NotFoundException } from '@nestjs/common';
import { RoutineOccurrenceStatus, type Prisma } from '@prisma/client';
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

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone || 'Asia/Kolkata';
  }

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
    const timezone = dto.timezone ?? (await this.getUserTimezone(userId));

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

  async pause(userId: string, id: string) {
    const existing = await this.prisma.routine.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Routine not found');

    if (!existing.active) return existing; // idempotent — already paused

    return this.prisma.routine.update({
      where: { id },
      data: { active: false },
    });
  }

  async resume(userId: string, id: string) {
    const existing = await this.prisma.routine.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Routine not found');

    if (existing.active) return existing; // idempotent — already active

    return this.prisma.routine.update({
      where: { id },
      data: { active: true },
    });
  }

  async archive(userId: string, id: string) {
    const existing = await this.prisma.routine.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Routine not found');

    // Archive = soft-delete by setting active: false
    // We also emit a behavior event for archiving
    const updated = await this.prisma.routine.update({
      where: { id },
      data: { active: false },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'routine.archived',
      entityType: 'Routine',
      entityId: id,
      metadata: { title: existing.title },
    });

    return updated;
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

  // ── RoutineOccurrences ────────────────────────────────────────────────────────

  async getOccurrences(
    userId: string,
    routineId: string,
    options?: { date?: string; status?: RoutineOccurrenceStatus; limit?: number },
  ) {
    const routine = await this.prisma.routine.findFirst({ where: { id: routineId, userId } });
    if (!routine) throw new NotFoundException('Routine not found');

    const limit = Math.min(options?.limit ?? 30, 100);

    return this.prisma.routineOccurrence.findMany({
      where: {
        routineId,
        userId,
        ...(options?.date ? { localDate: new Date(options.date) } : {}),
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { localDate: 'desc' },
      take: limit,
    });
  }

  async getOrCreateOccurrence(
    userId: string,
    routineId: string,
    localDate: string,
  ) {
    const routine = await this.prisma.routine.findFirst({ where: { id: routineId, userId } });
    if (!routine) throw new NotFoundException('Routine not found');

    const date = new Date(localDate);
    // Compute expectedAt from the preferredTime or midnight
    const [hh = '07', mm = '00'] = (routine.preferredTime ?? '07:00').split(':');
    const expectedAt = new Date(`${localDate}T${hh}:${mm}:00.000Z`);

    return this.prisma.routineOccurrence.upsert({
      where: { routineId_localDate: { routineId, localDate: date } },
      create: {
        routineId,
        userId,
        localDate: date,
        expectedAt,
        status: RoutineOccurrenceStatus.PENDING,
      },
      update: {}, // No updates on create if already exists
    });
  }

  async completeOccurrence(
    userId: string,
    routineId: string,
    occurrenceId: string,
    dto?: { actualDuration?: number },
  ) {
    const occurrence = await this.prisma.routineOccurrence.findFirst({
      where: { id: occurrenceId, routineId, userId },
    });
    if (!occurrence) throw new NotFoundException('Occurrence not found');

    if (occurrence.status === RoutineOccurrenceStatus.COMPLETED) return occurrence; // idempotent

    const routine = await this.prisma.routine.findFirst({ where: { id: routineId } });

    const updated = await this.prisma.routineOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: RoutineOccurrenceStatus.COMPLETED,
        completedAt: new Date(),
        startedAt: occurrence.startedAt ?? new Date(),
        ...(dto?.actualDuration !== undefined ? { actualDuration: dto.actualDuration } : {}),
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'routine.completed',
      entityType: 'RoutineOccurrence',
      entityId: occurrenceId,
      metadata: {
        routineId,
        title: routine?.title,
        localDate: occurrence.localDate,
        actualDuration: dto?.actualDuration,
      },
    });

    return updated;
  }

  async skipOccurrence(
    userId: string,
    routineId: string,
    occurrenceId: string,
    reason?: string,
  ) {
    const occurrence = await this.prisma.routineOccurrence.findFirst({
      where: { id: occurrenceId, routineId, userId },
    });
    if (!occurrence) throw new NotFoundException('Occurrence not found');

    if (occurrence.status === RoutineOccurrenceStatus.SKIPPED) return occurrence; // idempotent

    const updated = await this.prisma.routineOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: RoutineOccurrenceStatus.SKIPPED,
        skippedAt: new Date(),
        ...(reason ? { reason } : {}),
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'routine.skipped',
      entityType: 'RoutineOccurrence',
      entityId: occurrenceId,
      metadata: { routineId, reason },
    });

    return updated;
  }

  async markOccurrenceMissed(
    userId: string,
    routineId: string,
    occurrenceId: string,
  ) {
    const occurrence = await this.prisma.routineOccurrence.findFirst({
      where: { id: occurrenceId, routineId, userId },
    });
    if (!occurrence) throw new NotFoundException('Occurrence not found');

    if (
      occurrence.status === RoutineOccurrenceStatus.COMPLETED ||
      occurrence.status === RoutineOccurrenceStatus.MISSED
    ) {
      return occurrence; // no action
    }

    return this.prisma.routineOccurrence.update({
      where: { id: occurrenceId },
      data: { status: RoutineOccurrenceStatus.MISSED },
    });
  }
}
