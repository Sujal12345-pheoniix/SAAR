import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorEventsService } from '../behavior-events/behavior-events.service';
import type { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class DailyGrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviorEvents: BehaviorEventsService,
  ) {}

  private getTodayDateString(timezone: string = 'Asia/Kolkata'): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Returns YYYY-MM-DD
  }

  async getToday(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone || 'Asia/Kolkata';
    const todayStr = this.getTodayDateString(tz);
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    // 1. Fetch active goals
    const goals = await this.prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { lifeArea: true, metrics: true },
      orderBy: { priority: 'asc' },
    });

    // 2. Fetch today's tasks (due today, completed today, or open tasks)
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        OR: [
          { dueAt: { gte: startOfDay, lte: endOfDay } },
          { completedAt: { gte: startOfDay, lte: endOfDay } },
          { status: TaskStatus.TODO },
          { status: TaskStatus.IN_PROGRESS },
        ],
      },
      include: {
        goal: { select: { id: true, title: true } },
        lifeArea: { select: { id: true, title: true, type: true } },
      },
      orderBy: [{ dueAt: 'asc' }, { priority: 'asc' }],
    });

    // 3. Fetch active routines
    const routines = await this.prisma.routine.findMany({
      where: { userId, active: true },
      orderBy: { preferredTime: 'asc' },
    });

    // 4. Checkin status for today
    const checkin = await this.prisma.checkin.findFirst({
      where: {
        userId,
        localDate: todayDate,
      },
    });

    // 5. Future self summary
    const futureSelf = await this.prisma.futureSelf.findUnique({
      where: { userId },
      select: {
        futureIdentity: true,
        horizonYears: true,
      },
    });

    // 6. Deterministic alignment score preview (instant calculation, 0-100)
    let alignmentScore = 0;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

    // Component 1: Task completion (up to 50 points)
    if (totalTasks > 0) {
      alignmentScore += Math.round((completedTasks / totalTasks) * 50);
    } else {
      alignmentScore += 25; // Neutral baseline if no tasks scheduled
    }

    // Component 2: Check-in completion (25 points)
    if (checkin) {
      alignmentScore += 25;
    }

    // Component 3: Active routines baseline (up to 25 points)
    if (routines.length > 0) {
      alignmentScore += 25;
    } else {
      alignmentScore += 10;
    }

    alignmentScore = Math.min(100, Math.max(0, alignmentScore));

    return {
      date: todayStr,
      timezone: tz,
      futureSelf,
      alignmentScorePreview: alignmentScore,
      goals,
      tasks,
      routines,
      checkin,
      summary: {
        totalTasks,
        completedTasks,
        activeRoutinesCount: routines.length,
        hasCheckedIn: !!checkin,
      },
    };
  }

  async checkin(userId: string, dto: CreateCheckinDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone || 'Asia/Kolkata';
    const dateStr = dto.localDate || this.getTodayDateString(tz);
    const localDate = new Date(`${dateStr}T00:00:00.000Z`);

    const record = await this.prisma.checkin.upsert({
      where: {
        userId_localDate: {
          userId,
          localDate,
        },
      },
      update: {
        mood: dto.mood !== undefined ? dto.mood : undefined,
        energy: dto.energy !== undefined ? dto.energy : undefined,
        reflection: dto.reflection !== undefined ? dto.reflection : undefined,
        dayRating: dto.dayRating !== undefined ? dto.dayRating : undefined,
      },
      create: {
        userId,
        localDate,
        mood: dto.mood,
        energy: dto.energy,
        reflection: dto.reflection,
        dayRating: dto.dayRating,
      },
    });

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'checkin.completed',
      entityType: 'Checkin',
      entityId: record.id,
      metadata: {
        localDate: dateStr,
        mood: record.mood,
        energy: record.energy,
        dayRating: record.dayRating,
      },
    });

    return record;
  }

  async getSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone || 'Asia/Kolkata';
    const todayStr = this.getTodayDateString(tz);
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
    const sessionId = `session_${userId}_${todayStr}`;

    const [startedEvent, completedEvent, checkin, tasks] = await Promise.all([
      this.prisma.behaviorEvent.findFirst({
        where: {
          userId,
          eventType: 'daily_growth.started',
          occurredAt: { gte: todayDate },
        },
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.behaviorEvent.findFirst({
        where: {
          userId,
          eventType: 'daily_growth.completed',
          occurredAt: { gte: todayDate },
        },
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.checkin.findFirst({
        where: { userId, localDate: todayDate },
      }),
      this.prisma.task.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);

    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (completedEvent) {
      status = 'completed';
    } else if (startedEvent) {
      status = 'in_progress';
    }

    return {
      sessionId,
      date: todayStr,
      status,
      startedAt: startedEvent?.occurredAt ?? null,
      completedAt: completedEvent?.occurredAt ?? null,
      tasksCompleted: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
      checkinDone: !!checkin,
    };
  }

  async startSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone || 'Asia/Kolkata';
    const todayStr = this.getTodayDateString(tz);
    const sessionId = `session_${userId}_${todayStr}`;

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'daily_growth.started',
      entityType: 'GrowthSession',
      entityId: sessionId,
      metadata: { date: todayStr },
    });

    return {
      sessionId,
      status: 'in_progress',
      startedAt: new Date(),
    };
  }

  async completeSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone || 'Asia/Kolkata';
    const todayStr = this.getTodayDateString(tz);
    const sessionId = `session_${userId}_${todayStr}`;

    await this.behaviorEvents.logEvent({
      userId,
      eventType: 'daily_growth.completed',
      entityType: 'GrowthSession',
      entityId: sessionId,
      metadata: { date: todayStr },
    });

    return {
      sessionId,
      status: 'completed',
      completedAt: new Date(),
    };
  }
}
