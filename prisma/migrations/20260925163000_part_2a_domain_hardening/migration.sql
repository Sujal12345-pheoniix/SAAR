-- AlterEnum: Add RESCHEDULED to TaskStatus
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';

-- CreateEnum: RoutineOccurrenceStatus
CREATE TYPE "RoutineOccurrenceStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'MISSED');

-- AlterTable: life_areas
ALTER TABLE "life_areas" ADD COLUMN IF NOT EXISTS "color" TEXT,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "life_areas_userId_isActive_sortOrder_idx" ON "life_areas"("userId", "isActive", "sortOrder");

-- CreateTable: metric_observations
CREATE TABLE IF NOT EXISTS "metric_observations" (
    "id" UUID NOT NULL,
    "metricId" UUID NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'user',
    "unit" TEXT,
    "confidence" DECIMAL(5,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "metric_observations_metricId_observedAt_idx" ON "metric_observations"("metricId", "observedAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'metric_observations_metricId_fkey'
    ) THEN
        ALTER TABLE "metric_observations" ADD CONSTRAINT "metric_observations_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "goal_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: plans
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX IF NOT EXISTS "plans_userId_localDate_status_idx" ON "plans"("userId", "localDate", "status");

-- AlterTable: tasks
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "originalDueAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "skippedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rescheduledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "actualDurationMinutes" INTEGER,
ADD COLUMN IF NOT EXISTS "skipReason" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduleReason" TEXT;

CREATE INDEX IF NOT EXISTS "tasks_userId_scheduledAt_status_idx" ON "tasks"("userId", "scheduledAt", "status");

-- CreateTable: routine_occurrences
CREATE TABLE IF NOT EXISTS "routine_occurrences" (
    "id" UUID NOT NULL,
    "routineId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "localDate" DATE NOT NULL,
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "status" "RoutineOccurrenceStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_occurrences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "routine_occurrences_routineId_localDate_key" ON "routine_occurrences"("routineId", "localDate");
CREATE INDEX IF NOT EXISTS "routine_occurrences_userId_localDate_status_idx" ON "routine_occurrences"("userId", "localDate", "status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'routine_occurrences_routineId_fkey'
    ) THEN
        ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'routine_occurrences_userId_fkey'
    ) THEN
        ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: checkins
CREATE INDEX IF NOT EXISTS "checkins_userId_localDate_idx" ON "checkins"("userId", "localDate");

-- AlterTable: insights
ALTER TABLE "insights" ADD COLUMN IF NOT EXISTS "generationVersion" TEXT DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS "sourceDataRef" JSONB;

-- AlterTable: interventions
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "decisionReason" TEXT,
ADD COLUMN IF NOT EXISTS "executedAt" TIMESTAMP(3);

-- AlterTable: messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "tokenUsage" INTEGER,
ADD COLUMN IF NOT EXISTS "latencyMs" INTEGER;

-- AlterTable: memories
ALTER TABLE "memories" ADD COLUMN IF NOT EXISTS "confidence" DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS "sensitivity" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS "lastValidatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "userVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "userEditable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failureReason" TEXT;

-- AlterTable: outbox_events
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "schemaVersion" INTEGER NOT NULL DEFAULT 1;
