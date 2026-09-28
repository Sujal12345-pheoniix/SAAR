import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BehaviorEventsModule } from '../behavior-events/behavior-events.module';
import { GrowthEngineModule } from '../growth-engine/growth-engine.module';
import { InterventionsService } from './interventions.service';
import { InterventionsController } from './interventions.controller';

@Module({
  imports: [DatabaseModule, BehaviorEventsModule, GrowthEngineModule],
  controllers: [InterventionsController],
  providers: [InterventionsService],
  exports: [InterventionsService],
})
export class InterventionsModule {}
