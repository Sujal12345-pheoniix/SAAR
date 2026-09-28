import { Global, Module } from '@nestjs/common';
import { BehaviorEventsService } from './behavior-events.service';
import { BehaviorEventsController } from './behavior-events.controller';
import { DatabaseModule } from '../../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [BehaviorEventsController],
  providers: [BehaviorEventsService],
  exports: [BehaviorEventsService],
})
export class BehaviorEventsModule {}
