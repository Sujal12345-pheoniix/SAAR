import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BehaviorEventsModule } from '../behavior-events/behavior-events.module';
import { GrowthEngineModule } from '../growth-engine/growth-engine.module';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';

@Module({
  imports: [DatabaseModule, BehaviorEventsModule, GrowthEngineModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
