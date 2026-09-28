import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface RawDayFacts {
  userId: string;
  targetDate: string; // YYYY-MM-DD
  timezone: string;
  checkin: {
    id?: string;
    mood: number | null;
    energy: number | null;
    reflection: string | null;
    dayRating: number | null;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: number;
    dueAt: Date | null;
    scheduledAt: Date | null;
    completedAt: Date | null;
    skippedAt: Date | null;
    rescheduledAt: Date | null;
    rescheduleCount: number;
    estimatedMinutes: number | null;
    actualDurationMinutes: number | null;
    goalId: string | null;
    lifeAreaId: string | null;
  }>;
  routines: Array<{
    id: string;
    title: string;
    preferredTime: string | null;
  }>;
  goals: Array<{
    id: string;
    title: string;
    priority: number;
  }>;
  sessionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
}

@Injectable()
export class DailyStateBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone ?? 'Asia/Kolkata';
  }

  getTodayDateString(timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  }

  async buildRawDayFacts(userId: string, targetDateStr?: string): Promise<RawDayFacts> {
    const timezone = await this.getUserTimezone(userId);
    const dateStr = targetDateStr || this.getTodayDateString(timezone);

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const [checkin, tasks, routines, goals, startedEvent, completedEvent] = await Promise.all([
      this.prisma.checkin.findFirst({
        where: { userId, localDate: startOfDay },
      }),
      this.prisma.task.findMany({
        where: {
          userId,
          OR: [
            { dueAt: { gte: startOfDay, lte: endOfDay } },
            { completedAt: { gte: startOfDay, lte: endOfDay } },
            { scheduledAt: { gte: startOfDay, lte: endOfDay } },
            { status: 'TODO' },
            { status: 'IN_PROGRESS' },
          ],
        },
      }),
      this.prisma.routine.findMany({
        where: { userId, active: true },
        select: { id: true, title: true, preferredTime: true },
      }),
      this.prisma.goal.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { id: true, title: true, priority: true },
      }),
      this.prisma.behaviorEvent.findFirst({
        where: {
          userId,
          eventType: 'daily_growth.started',
          occurredAt: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.behaviorEvent.findFirst({
        where: {
          userId,
          eventType: 'daily_growth.completed',
          occurredAt: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { occurredAt: 'desc' },
      }),
    ]);

    let sessionStatus: RawDayFacts['sessionStatus'] = 'NOT_STARTED';
    if (completedEvent) {
      sessionStatus = 'COMPLETED';
    } else if (startedEvent) {
      sessionStatus = 'IN_PROGRESS';
    }

    return {
      userId,
      targetDate: dateStr,
      timezone,
      checkin: checkin
        ? {
            id: checkin.id,
            mood: checkin.mood,
            energy: checkin.energy,
            reflection: checkin.reflection,
            dayRating: checkin.dayRating,
          }
        : null,
      tasks,
      routines,
      goals,
      sessionStatus,
      startedAt: startedEvent?.occurredAt.toISOString() ?? null,
      completedAt: completedEvent?.occurredAt.toISOString() ?? null,
    };
  }
}
