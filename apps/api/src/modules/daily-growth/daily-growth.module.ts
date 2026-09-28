import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BehaviorEventsModule } from '../behavior-events/behavior-events.module';
import { GrowthEngineModule } from '../growth-engine/growth-engine.module';
import { InterventionsModule } from '../interventions/interventions.module';
import { DailyGrowthController } from './daily-growth.controller';
import { DailyGrowthService } from './daily-growth.service';
import { DailyGrowthOrchestratorService } from './daily-growth-orchestrator.service';
import { DailyStateBuilderService } from './services/daily-state-builder.service';
import { ExecutionAnalyzerService } from './services/execution-analyzer.service';
import { GapAnalyzerService } from './services/gap-analyzer.service';
import { TradeoffAnalyzerService } from './services/tradeoff-analyzer.service';
import { InterventionSelectorService } from './services/intervention-selector.service';
import { TomorrowPlannerService } from './services/tomorrow-planner.service';

@Module({
  imports: [
    DatabaseModule,
    BehaviorEventsModule,
    GrowthEngineModule,
    InterventionsModule,
  ],
  controllers: [DailyGrowthController],
  providers: [
    DailyGrowthService,
    DailyGrowthOrchestratorService,
    DailyStateBuilderService,
    ExecutionAnalyzerService,
    GapAnalyzerService,
    TradeoffAnalyzerService,
    InterventionSelectorService,
    TomorrowPlannerService,
  ],
  exports: [DailyGrowthService, DailyGrowthOrchestratorService],
})
export class DailyGrowthModule {}
