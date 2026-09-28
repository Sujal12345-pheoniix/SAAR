import { Injectable } from '@nestjs/common';
import { BehaviorAggregatorService } from './behavior-aggregator.service';
import {
  calculateConsistencySignal,
  calculateMomentumSignal,
  calculateBalanceSignal,
  type GrowthSignal,
} from '@saar/domain';

export interface GrowthSignalsBundle {
  calculatedAt: string;
  consistency: GrowthSignal;
  momentum: GrowthSignal;
  balance: GrowthSignal;
}

@Injectable()
export class SignalEngineService {
  constructor(private readonly aggregator: BehaviorAggregatorService) {}

  /**
   * Generates the multi-dimensional Growth Signals for an authenticated user.
   */
  async getSignals(userId: string): Promise<GrowthSignalsBundle> {
    const snapshot = await this.aggregator.getFeatureSnapshot(userId);
    const calculatedAt = new Date().toISOString();

    const consistency = calculateConsistencySignal(
      snapshot.execution7d,
      snapshot.consistency7d,
      snapshot.routine7d,
      calculatedAt,
    );

    const momentum = calculateMomentumSignal(
      snapshot.execution14d,
      snapshot.executionPrevious14d,
      calculatedAt,
    );

    const balance = calculateBalanceSignal(
      snapshot.lifeAreas14d,
      calculatedAt,
    );

    return {
      calculatedAt,
      consistency,
      momentum,
      balance,
    };
  }
}
