import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from './common/throttler/throttler-storage-redis.service';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BehaviorEventsModule } from './modules/behavior-events/behavior-events.module';
import { LifeAreasModule } from './modules/life-areas/life-areas.module';
import { FutureSelfModule } from './modules/future-self/future-self.module';
import { GoalsModule } from './modules/goals/goals.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { RoutinesModule } from './modules/routines/routines.module';
import { DailyGrowthModule } from './modules/daily-growth/daily-growth.module';
import { PlansModule } from './modules/plans/plans.module';
import { GrowthEngineModule } from './modules/growth-engine/growth-engine.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { ScheduleModule } from './modules/schedule/schedule.module';

@Module({
  imports: [
    // ── Config: global, Joi-validated ───────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // ── Rate limiting (Redis-backed in dev/prod, in-memory in test) ───────────
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const isTest = process.env['NODE_ENV'] === 'test' || process.env['SKIP_REDIS_THROTTLE'] === 'true';
        const redisUrl = process.env['REDIS_URL'];
        const storage = !isTest && redisUrl
          ? new ThrottlerStorageRedisService(redisUrl)
          : undefined;

        return {
          throttlers: [
            {
              ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),
              limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
            },
          ],
          storage,
        };
      },
    }),

    // ── Feature modules ──────────────────────────────────────────────────────
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BehaviorEventsModule,
    LifeAreasModule,
    FutureSelfModule,
    GoalsModule,
    TasksModule,
    RoutinesModule,
    DailyGrowthModule,
    PlansModule,
    GrowthEngineModule,
    InterventionsModule,
    ScheduleModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
