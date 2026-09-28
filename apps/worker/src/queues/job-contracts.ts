import { z } from 'zod';

export const NotificationJobSchema = z.object({
  jobId: z.string().uuid().optional(),
  notificationId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string().min(1),
  body: z.string(),
  scheduledAt: z.string().datetime(),
  channel: z.enum(['PUSH', 'IN_APP', 'EMAIL']).default('PUSH'),
  idempotencyKey: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type NotificationJob = z.infer<typeof NotificationJobSchema>;

export const DailyGrowthJobSchema = z.object({
  jobId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  idempotencyKey: z.string().min(1),
  forceRegenerate: z.boolean().default(false),
});
export type DailyGrowthJob = z.infer<typeof DailyGrowthJobSchema>;

export const RoutineOccurrenceJobSchema = z.object({
  jobId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  routineId: z.string().uuid(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expectedAt: z.string().datetime(),
  idempotencyKey: z.string().min(1),
});
export type RoutineOccurrenceJob = z.infer<typeof RoutineOccurrenceJobSchema>;

export const OutboxDispatchJobSchema = z.object({
  jobId: z.string().uuid().optional(),
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().min(1),
});
export type OutboxDispatchJob = z.infer<typeof OutboxDispatchJobSchema>;

export const MaintenanceJobSchema = z.object({
  jobId: z.string().uuid().optional(),
  taskType: z.enum(['CLEANUP_EXPIRED_SESSIONS', 'PRUNE_PROCESSED_OUTBOX', 'PURGE_TEMPORARY_DATA']),
  retentionDays: z.number().int().positive().default(30),
  idempotencyKey: z.string().min(1),
});
export type MaintenanceJob = z.infer<typeof MaintenanceJobSchema>;
