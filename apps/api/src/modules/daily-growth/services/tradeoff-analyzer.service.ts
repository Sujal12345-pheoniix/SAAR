import { Injectable } from '@nestjs/common';
import {
  analyzeTradeoff,
  type TradeoffAnalysis,
  type CandidateAction,
  type ResourceBudget,
} from '@saar/domain';
import { BehaviorAggregatorService } from '../../growth-engine/behavior-aggregator.service';
import type { RawDayFacts } from './daily-state-builder.service';

@Injectable()
export class TradeoffAnalyzerService {
  constructor(private readonly aggregator: BehaviorAggregatorService) {}

  async analyzeDayTradeoffs(
    userId: string,
    rawFacts: RawDayFacts,
    proposedActions: CandidateAction[] = [],
  ): Promise<TradeoffAnalysis[]> {
    const snapshot = await this.aggregator.getFeatureSnapshot(userId);

    const plannedTaskMinutes = rawFacts.tasks.reduce(
      (sum, t) => sum + (t.actualDurationMinutes ?? t.estimatedMinutes ?? 30),
      0,
    );

    const budget: ResourceBudget = {
      totalDailyMinutes: 1440,
      sleepMinutes: 480, // 8h
      fixedCommitmentMinutes: 480, // 8h default
      scheduledRoutineMinutes: rawFacts.routines.length * 30,
      plannedTaskMinutes,
      bufferReserveMinutes: 60,
    };

    return proposedActions.map((action) =>
      analyzeTradeoff(action, budget, snapshot.lifeAreas14d),
    );
  }
}
