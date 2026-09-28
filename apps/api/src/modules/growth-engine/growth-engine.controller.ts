import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { BehaviorAggregatorService } from './behavior-aggregator.service';
import { SignalEngineService } from './signal-engine.service';
import { GapEngineService } from './gap-engine.service';

@Controller({ path: 'growth', version: '1' })
@UseGuards(JwtAuthGuard)
export class GrowthEngineController {
  constructor(
    private readonly aggregator: BehaviorAggregatorService,
    private readonly signalEngine: SignalEngineService,
    private readonly gapEngine: GapEngineService,
  ) {}

  /**
   * GET /api/v1/growth/features
   * Returns deterministic multi-window feature rollups (7d, 14d, 30d).
   */
  @Get('features')
  getFeatures(@CurrentUser() user: AuthenticatedUser) {
    return this.aggregator.getFeatureSnapshot(user.userId);
  }

  /**
   * GET /api/v1/growth/signals
   * Returns Consistency, Momentum, and Balance directional signals.
   */
  @Get('signals')
  getSignals(@CurrentUser() user: AuthenticatedUser) {
    return this.signalEngine.getSignals(user.userId);
  }

  /**
   * GET /api/v1/growth/gaps
   * Evaluates and returns structured Gap findings backed by factual evidence.
   */
  @Get('gaps')
  getGaps(@CurrentUser() user: AuthenticatedUser) {
    return this.gapEngine.evaluateGaps(user.userId);
  }

  /**
   * GET /api/v1/growth/life-areas
   * Returns life area activity distribution and balance entropy score.
   */
  @Get('life-areas')
  getLifeAreaDistribution(@CurrentUser() user: AuthenticatedUser) {
    return this.aggregator.aggregateLifeAreaFeatures(user.userId, 14);
  }

  /**
   * POST /api/v1/growth/recalculate
   * Forces on-demand deterministic evaluation of signals and gaps.
   */
  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  async recalculate(@CurrentUser() user: AuthenticatedUser) {
    const [signals, gaps] = await Promise.all([
      this.signalEngine.getSignals(user.userId),
      this.gapEngine.evaluateGaps(user.userId),
    ]);
    return {
      success: true,
      calculatedAt: new Date().toISOString(),
      signals,
      gaps,
    };
  }
}
