import { Module } from '@nestjs/common';
import { DailyGrowthController } from './daily-growth.controller';
import { DailyGrowthService } from './daily-growth.service';

@Module({
  controllers: [DailyGrowthController],
  providers: [DailyGrowthService],
  exports: [DailyGrowthService],
})
export class DailyGrowthModule {}
