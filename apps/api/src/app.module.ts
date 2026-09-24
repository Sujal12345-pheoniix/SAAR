import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

    // ── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),
            limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
          },
        ],
      }),
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
  ],
})
export class AppModule {}
