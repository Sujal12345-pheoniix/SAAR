import { Module } from '@nestjs/common';
import { LifeAreasController } from './life-areas.controller';
import { LifeAreasService } from './life-areas.service';

@Module({
  controllers: [LifeAreasController],
  providers: [LifeAreasService],
  exports: [LifeAreasService],
})
export class LifeAreasModule {}
