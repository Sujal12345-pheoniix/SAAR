import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorAggregatorService } from './behavior-aggregator.service';
import {
  detectGaps,
  type GrowthFinding,
  type GoalComparisonTarget,
  type FutureSelfTarget,
} from '@saar/domain';

@Injectable()
export class GapEngineService {
  private readonly logger = new Logger(GapEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregator: BehaviorAggregatorService,
  ) {}

  /**
   * Evaluates all gaps between Desired Intent (Goals + Future Self) and Observed Reality.
   */
  async evaluateGaps(userId: string): Promise<GrowthFinding[]> {
    const snapshot = await this.aggregator.getFeatureSnapshot(userId);

    // Fetch user goals and metric targets
    const goals = await this.prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        lifeArea: { select: { type: true } },
        metrics: {
          select: {
            id: true,
            metricType: true,
            targetValue: true,
            currentValue: true,
            unit: true,
          },
        },
      },
    });

    const comparisonGoals: GoalComparisonTarget[] = goals.map((g) => {
      const primaryMetric = g.metrics[0];
      return {
        id: g.id,
        title: g.title,
        priority: g.priority,
        lifeAreaType: g.lifeArea?.type,
        targetMetricValue: primaryMetric?.targetValue ? Number(primaryMetric.targetValue) : undefined,
        currentMetricValue: primaryMetric?.currentValue ? Number(primaryMetric.currentValue) : undefined,
        unit: primaryMetric?.unit ?? undefined,
      };
    });

    // Fetch future self definition
    const fs = await this.prisma.futureSelf.findUnique({
      where: { userId },
    });

    const futureSelf: FutureSelfTarget | null = fs
      ? {
          futureIdentity: fs.futureIdentity ?? undefined,
          horizonYears: fs.horizonYears ?? undefined,
          desiredStates: (fs.desiredStates as Record<string, string>) ?? undefined,
          priorities: (fs.priorities as string[]) ?? undefined,
          values: (fs.values as string[]) ?? undefined,
          lifeAreaTargets: (fs.lifeAreaTargets as Record<string, string>) ?? undefined,
        }
      : null;

    // Count task completions by goal over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const completedTasksWithGoal = await this.prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo },
        goalId: { not: null },
      },
      select: { goalId: true },
    });

    const taskCompletionsByGoal: Record<string, number> = {};
    for (const t of completedTasksWithGoal) {
      if (t.goalId) {
        taskCompletionsByGoal[t.goalId] = (taskCompletionsByGoal[t.goalId] ?? 0) + 1;
      }
    }

    // Run pure deterministic gap detector
    const findings = detectGaps({
      userId,
      goals: comparisonGoals,
      futureSelf,
      execution7d: snapshot.execution7d,
      execution30d: snapshot.execution30d,
      consistency7d: snapshot.consistency7d,
      routine7d: snapshot.routine7d,
      lifeAreas: snapshot.lifeAreas14d,
      taskCompletionsByGoal,
    });

    // Persist or sync high-value findings into Insight records for persistence
    await this.syncInsights(userId, findings);

    return findings;
  }

  /**
   * Persists established and emerging findings to the insights table
   * without creating duplicate records for identical gaps.
   */
  private async syncInsights(userId: string, findings: GrowthFinding[]): Promise<void> {
    for (const finding of findings) {
      // Map gap type to schema insight type
      let insightType = 'friction';
      if (finding.gapType === 'QUANTITY_GAP' || finding.gapType === 'PRIORITY_GAP') {
        insightType = 'goal_stall';
      } else if (finding.gapType === 'CONSISTENCY_GAP') {
        insightType = 'consistency';
      } else if (finding.gapType === 'BALANCE_GAP') {
        insightType = 'load_imbalance';
      }

      // Check if an active insight already exists for this exact title/gap
      const existing = await this.prisma.insight.findFirst({
        where: {
          userId,
          title: finding.title,
          status: 'NEW',
        },
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
            confidence: finding.confidence === 'ESTABLISHED_SIGNAL' ? 0.9 : finding.confidence === 'EMERGING_SIGNAL' ? 0.6 : 0.3,
            generationVersion: finding.algorithmVersion,
          },
        });
      }
    }
  }
}
