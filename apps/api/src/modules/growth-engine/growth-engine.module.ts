import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GrowthEngineController } from './growth-engine.controller';
import { BehaviorAggregatorService } from './behavior-aggregator.service';
import { SignalEngineService } from './signal-engine.service';
import { GapEngineService } from './gap-engine.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GrowthEngineController],
  providers: [
    BehaviorAggregatorService,
    SignalEngineService,
    GapEngineService,
  ],
  exports: [
    BehaviorAggregatorService,
    SignalEngineService,
    GapEngineService,
  ],
})
export class GrowthEngineModule {}
