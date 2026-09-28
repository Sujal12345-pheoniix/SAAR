import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './database/prisma.service';
import { OutboxPublisherService } from './outbox/outbox-publisher.service';
import { NotificationWorkerService } from './notifications/notification-worker.service';
import { DailyPlanGeneratorService } from './daily-growth/daily-plan-generator.service';
import { RoutineOccurrenceGeneratorService } from './routines/routine-occurrence-generator.service';
import { MaintenanceWorkerService } from './maintenance/maintenance-worker.service';
import { GrowthAggregationWorkerService } from './growth-engine/growth-aggregation-worker.service';
import { InterventionOutcomeWorkerService } from './growth-engine/intervention-outcome-worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [
    PrismaService,
    OutboxPublisherService,
    NotificationWorkerService,
    DailyPlanGeneratorService,
    RoutineOccurrenceGeneratorService,
    MaintenanceWorkerService,
    GrowthAggregationWorkerService,
    InterventionOutcomeWorkerService,
  ],
  exports: [
    PrismaService,
    OutboxPublisherService,
    NotificationWorkerService,
    DailyPlanGeneratorService,
    RoutineOccurrenceGeneratorService,
    MaintenanceWorkerService,
    GrowthAggregationWorkerService,
    InterventionOutcomeWorkerService,
  ],
})
export class WorkerModule {}
