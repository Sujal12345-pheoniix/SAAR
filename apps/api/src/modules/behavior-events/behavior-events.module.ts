import { Global, Module } from '@nestjs/common';
import { BehaviorEventsService } from './behavior-events.service';

@Global()
@Module({
  providers: [BehaviorEventsService],
  exports: [BehaviorEventsService],
})
export class BehaviorEventsModule {}
