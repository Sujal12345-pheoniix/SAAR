import { Injectable } from '@nestjs/common';
import {
  calculateScheduleCapacity,
  rankCandidates,
  compileTomorrowPlanPreview,
  type DailyTomorrowPlanPreview,
  type ScheduleCandidate,
  type LifeAreaType,
} from '@saar/domain';
import { PrismaService } from '../../../database/prisma.service';
import { BehaviorAggregatorService } from '../../growth-engine/behavior-aggregator.service';
import type { RawDayFacts } from './daily-state-builder.service';

@Injectable()
export class TomorrowPlannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregator: BehaviorAggregatorService,
  ) {}

  private getTomorrowDateString(currentDateStr: string): string {
    const d = new Date(`${currentDateStr}T00:00:00.000Z`);
    const tomorrow = new Date(d.getTime() + 86_400_000);
    return tomorrow.toISOString().slice(0, 10);
  }

  async planTomorrow(userId: string, rawFacts: RawDayFacts): Promise<DailyTomorrowPlanPreview> {
    const tomorrowStr = this.getTomorrowDateString(rawFacts.targetDate);

    // Fetch open tasks
    const openTasks = await this.prisma.task.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      include: {
        goal: { select: { priority: true } },
        lifeArea: { select: { type: true } },
      },
      orderBy: { priority: 'asc' },
    });

    const snapshot = await this.aggregator.getFeatureSnapshot(userId);

    const candidates: ScheduleCandidate[] = openTasks.map((t) => ({
      id: t.id,
      title: t.title,
      goalId: t.goalId ?? undefined,
      goalPriority: t.goal?.priority ?? t.priority,
      lifeAreaType: (t.lifeArea?.type?.toLowerCase() as LifeAreaType) ?? 'mind',
      dueAt: t.dueAt?.toISOString() ?? undefined,
      estimatedMinutes: t.estimatedMinutes ?? 30,
      rescheduleCount: t.rescheduleCount,
    }));

    const capacity = calculateScheduleCapacity(
      [],
      rawFacts.routines.map((r) => ({ id: r.id })),
    );

    const ranked = rankCandidates(candidates, {
      targetDate: tomorrowStr,
      lifeAreaFeatures: snapshot.lifeAreas14d,
    });

    return compileTomorrowPlanPreview(ranked, capacity, tomorrowStr);
  }
}
