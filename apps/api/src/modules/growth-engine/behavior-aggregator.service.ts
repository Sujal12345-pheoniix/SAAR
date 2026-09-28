import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  getLocalDateString,
  getRecentLocalDates,
  calculateExecutionFeatures,
  calculateConsistencyFeatures,
  calculateRoutineFeatures,
  calculateWellBeingFeatures,
  calculateLifeAreaFeatures,
  type ExecutionFeatures,
  type ConsistencyFeatures,
  type RoutineFeatures,
  type WellBeingFeatures,
  type LifeAreaFeatures,
} from '@saar/domain';

export interface ComprehensiveFeatureSnapshot {
  calculatedAt: string;
  timezone: string;
  execution7d: ExecutionFeatures;
  execution14d: ExecutionFeatures;
  executionPrevious14d: ExecutionFeatures;
  execution30d: ExecutionFeatures;
  consistency7d: ConsistencyFeatures;
  consistency30d: ConsistencyFeatures;
  routine7d: RoutineFeatures;
  routine14d: RoutineFeatures;
  wellbeing7d: WellBeingFeatures;
  wellbeing30d: WellBeingFeatures;
  lifeAreas14d: LifeAreaFeatures;
}

@Injectable()
export class BehaviorAggregatorService {
  private readonly logger = new Logger(BehaviorAggregatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone || 'UTC';
  }

  /**
   * Aggregates execution features (tasks planned, completed, skipped, rescheduled)
   * over a rolling window of N local calendar days.
   */
  async aggregateExecutionFeatures(
    userId: string,
    windowDays: number,
    offsetDays: number = 0,
    timezone?: string,
  ): Promise<ExecutionFeatures> {
    const tz = timezone ?? (await this.getUserTimezone(userId));
    const now = new Date();
    const refDate = new Date(now.getTime() - offsetDays * 86_400_000);
    const windowDateStrings = getRecentLocalDates(windowDays, refDate, tz);

    const startDate = new Date(`${windowDateStrings[0]}T00:00:00.000Z`);
    const endDate = new Date(`${windowDateStrings[windowDateStrings.length - 1]}T23:59:59.999Z`);

    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        OR: [
          { dueAt: { gte: startDate, lte: endDate } },
          { completedAt: { gte: startDate, lte: endDate } },
          { skippedAt: { gte: startDate, lte: endDate } },
          { rescheduledAt: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        status: true,
        actualDurationMinutes: true,
      },
    });

    return calculateExecutionFeatures(tasks, windowDays, now.toISOString());
  }

  /**
   * Aggregates consistency features (streak, daily completion variance, stability).
   */
  async aggregateConsistencyFeatures(
    userId: string,
    windowDays: number,
    timezone?: string,
  ): Promise<ConsistencyFeatures> {
    const tz = timezone ?? (await this.getUserTimezone(userId));
    const now = new Date();
    const todayStr = getLocalDateString(now, tz);
    const windowDateStrings = getRecentLocalDates(windowDays, now, tz);
    const startDate = new Date(`${windowDateStrings[0]}T00:00:00.000Z`);

    const completedTasks = await this.prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: startDate },
      },
      select: { completedAt: true },
    });

    const completedDates: string[] = [];
    const countsMap = new Map<string, number>();

    for (const d of windowDateStrings) {
      countsMap.set(d, 0);
    }

    for (const t of completedTasks) {
      if (t.completedAt) {
        const dStr = getLocalDateString(t.completedAt, tz);
        completedDates.push(dStr);
        countsMap.set(dStr, (countsMap.get(dStr) ?? 0) + 1);
      }
    }

    const dailyCounts = Array.from(countsMap.values());

    return calculateConsistencyFeatures(completedDates, todayStr, windowDays, dailyCounts, now.toISOString());
  }

  /**
   * Aggregates routine adherence features.
   */
  async aggregateRoutineFeatures(
    userId: string,
    windowDays: number,
    timezone?: string,
  ): Promise<RoutineFeatures> {
    const tz = timezone ?? (await this.getUserTimezone(userId));
    const now = new Date();
    const windowDateStrings = getRecentLocalDates(windowDays, now, tz);
    const startDate = new Date(`${windowDateStrings[0]}T00:00:00.000Z`);
    const endDate = new Date(`${windowDateStrings[windowDateStrings.length - 1]}T23:59:59.999Z`);

    const occurrences = await this.prisma.routineOccurrence.findMany({
      where: {
        userId,
        localDate: { gte: startDate, lte: endDate },
      },
      select: { status: true },
    });

    return calculateRoutineFeatures(occurrences, windowDays, now.toISOString());
  }

  /**
   * Aggregates subjective check-in well-being features.
   */
  async aggregateWellBeingFeatures(
    userId: string,
    windowDays: number,
    timezone?: string,
  ): Promise<WellBeingFeatures> {
    const tz = timezone ?? (await this.getUserTimezone(userId));
    const now = new Date();
    const windowDateStrings = getRecentLocalDates(windowDays, now, tz);
    const startDate = new Date(`${windowDateStrings[0]}T00:00:00.000Z`);

    const checkins = await this.prisma.checkin.findMany({
      where: {
        userId,
        localDate: { gte: startDate },
      },
      select: {
        mood: true,
        energy: true,
        dayRating: true,
        localDate: true,
      },
    });

    const mapped = checkins.map((c) => ({
      mood: c.mood,
      energy: c.energy,
      dayRating: c.dayRating,
      localDate: c.localDate.toISOString().slice(0, 10),
    }));

    return calculateWellBeingFeatures(mapped, windowDays, now.toISOString());
  }

  /**
   * Aggregates life area activity distribution and balance entropy.
   */
  async aggregateLifeAreaFeatures(
    userId: string,
    windowDays: number,
    timezone?: string,
  ): Promise<LifeAreaFeatures> {
    const tz = timezone ?? (await this.getUserTimezone(userId));
    const now = new Date();
    const windowDateStrings = getRecentLocalDates(windowDays, now, tz);
    const startDate = new Date(`${windowDateStrings[0]}T00:00:00.000Z`);

    const completedTasks = await this.prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: startDate },
        lifeAreaId: { not: null },
      },
      include: {
        lifeArea: { select: { id: true, title: true, type: true } },
      },
    });

    const activities = completedTasks
      .filter((t) => Boolean(t.lifeArea))
      .map((t) => ({
        areaId: t.lifeArea!.id,
        areaType: t.lifeArea!.type,
        title: t.lifeArea!.title,
      }));

    return calculateLifeAreaFeatures(activities, windowDays, now.toISOString());
  }

  /**
   * Aggregates all behavioral features into a unified multi-window snapshot.
   */
  async getFeatureSnapshot(userId: string): Promise<ComprehensiveFeatureSnapshot> {
    const timezone = await this.getUserTimezone(userId);

    const [
      execution7d,
      execution14d,
      executionPrevious14d,
      execution30d,
      consistency7d,
      consistency30d,
      routine7d,
      routine14d,
      wellbeing7d,
      wellbeing30d,
      lifeAreas14d,
    ] = await Promise.all([
      this.aggregateExecutionFeatures(userId, 7, 0, timezone),
      this.aggregateExecutionFeatures(userId, 14, 0, timezone),
      this.aggregateExecutionFeatures(userId, 14, 14, timezone), // offset 14d for prior window
      this.aggregateExecutionFeatures(userId, 30, 0, timezone),
      this.aggregateConsistencyFeatures(userId, 7, timezone),
      this.aggregateConsistencyFeatures(userId, 30, timezone),
      this.aggregateRoutineFeatures(userId, 7, timezone),
      this.aggregateRoutineFeatures(userId, 14, timezone),
      this.aggregateWellBeingFeatures(userId, 7, timezone),
      this.aggregateWellBeingFeatures(userId, 30, timezone),
      this.aggregateLifeAreaFeatures(userId, 14, timezone),
    ]);

    return {
      calculatedAt: new Date().toISOString(),
      timezone,
      execution7d,
      execution14d,
      executionPrevious14d,
      execution30d,
      consistency7d,
      consistency30d,
      routine7d,
      routine14d,
      wellbeing7d,
      wellbeing30d,
      lifeAreas14d,
    };
  }
}
