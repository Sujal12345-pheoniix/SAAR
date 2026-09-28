import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  calculateExecutionFeatures,
  calculateConsistencyFeatures,
  calculateRoutineFeatures,
  detectGaps,
  type GoalComparisonTarget,
} from '@saar/domain';

@Injectable()
export class GrowthAggregationWorkerService {
  private readonly logger = new Logger(GrowthAggregationWorkerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates and updates intelligence features for a specific user asynchronously.
   * Idempotent and safe to run on every outbox event or background schedule.
   */
  async aggregateUserGrowth(userId: string): Promise<{ gapsDetected: number }> {
    this.logger.log(`Starting background growth aggregation for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, timezone: true },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for aggregation`);
      return { gapsDetected: 0 };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

    // 1. Fetch recent tasks
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        OR: [
          { dueAt: { gte: sevenDaysAgo } },
          { completedAt: { gte: sevenDaysAgo } },
        ],
      },
      select: {
        status: true,
        actualDurationMinutes: true,
        completedAt: true,
        goalId: true,
      },
    });

    const execution7d = calculateExecutionFeatures(tasks, 7, now.toISOString());

    // 2. Consistency
    const completedDates = tasks
      .filter((t) => t.status === 'COMPLETED' && t.completedAt)
      .map((t) => t.completedAt!.toISOString().slice(0, 10));

    const consistency7d = calculateConsistencyFeatures(completedDates, now.toISOString().slice(0, 10), 7, [
      completedDates.length,
    ]);

    // 3. Routine occurrences
    const occurrences = await this.prisma.routineOccurrence.findMany({
      where: {
        userId,
        localDate: { gte: sevenDaysAgo },
      },
      select: { status: true },
    });

    const routine7d = calculateRoutineFeatures(occurrences, 7, now.toISOString());

    // 4. Goals
    const goals = await this.prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        lifeArea: { select: { type: true } },
        metrics: {
          select: {
            targetValue: true,
            currentValue: true,
            unit: true,
          },
        },
      },
    });

    const comparisonGoals: GoalComparisonTarget[] = goals.map((g) => ({
      id: g.id,
      title: g.title,
      priority: g.priority,
      lifeAreaType: g.lifeArea?.type,
      targetMetricValue: g.metrics[0]?.targetValue ? Number(g.metrics[0].targetValue) : undefined,
      currentMetricValue: g.metrics[0]?.currentValue ? Number(g.metrics[0].currentValue) : undefined,
      unit: g.metrics[0]?.unit ?? undefined,
    }));

    // 5. Detect Gaps
    const findings = detectGaps({
      userId,
      goals: comparisonGoals,
      execution7d,
      consistency7d,
      routine7d,
      lifeAreas: {
        name: 'life_area_features',
        version: '1.0.0',
        windowDays: 7,
        sampleSize: 0,
        confidence: 'NO_DATA',
        calculatedAt: now.toISOString(),
        distributions: [],
        topAreaType: null,
        entropyScore: 1.0,
      },
    });

    // 6. Sync insights idempotently
    for (const finding of findings) {
      let insightType = 'friction';
      if (finding.gapType === 'QUANTITY_GAP' || finding.gapType === 'PRIORITY_GAP') {
        insightType = 'goal_stall';
      } else if (finding.gapType === 'CONSISTENCY_GAP') {
        insightType = 'consistency';
      } else if (finding.gapType === 'BALANCE_GAP') {
        insightType = 'load_imbalance';
      }

      const existing = await this.prisma.insight.findFirst({
        where: { userId, title: finding.title, status: 'NEW' },
      });

      if (!existing) {
        await this.prisma.insight.create({
          data: {
            userId,
            goalId: finding.goalId ?? null,
            type: insightType,
            status: 'NEW',
            title: finding.title,
            summary: finding.summary,
            evidence: finding.evidence as unknown as Prisma.InputJsonValue,
            recommendation: {
              gapType: finding.gapType,
              magnitude: finding.magnitude,
              trend: finding.trend,
            },
            confidence: finding.confidence === 'ESTABLISHED_SIGNAL' ? 0.9 : 0.6,
            generationVersion: finding.algorithmVersion,
          },
        });
      }
    }

    this.logger.log(`Growth aggregation completed for user ${userId}: ${findings.length} findings evaluated`);
    return { gapsDetected: findings.length };
  }
}
