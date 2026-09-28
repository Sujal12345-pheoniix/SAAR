import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './database/prisma.service';
import { OutboxPublisherService } from './outbox/outbox-publisher.service';
import { NotificationWorkerService } from './notifications/notification-worker.service';
import { DailyPlanGeneratorService } from './daily-growth/daily-plan-generator.service';
import { RoutineOccurrenceGeneratorService } from './routines/routine-occurrence-generator.service';
import { MaintenanceWorkerService } from './maintenance/maintenance-worker.service';

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
  ],
  exports: [
    PrismaService,
    OutboxPublisherService,
    NotificationWorkerService,
    DailyPlanGeneratorService,
    RoutineOccurrenceGeneratorService,
    MaintenanceWorkerService,
  ],
})
export class WorkerModule {}
