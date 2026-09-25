import { z } from 'zod';
import { EventType } from './index.js';

/**
 * Universal Event Envelope Zod Schema
 */
export const EventEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(EventType),
  schemaVersion: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  producer: z.string().min(1),
  actor: z.object({
    type: z.enum(['USER', 'SYSTEM', 'ADMIN', 'SUPPORT']),
    id: z.string().min(1),
  }),
  aggregate: z.object({
    type: z.string().min(1),
    id: z.string().min(1),
  }),
  payload: z.record(z.string(), z.unknown()),
  traceId: z.string().optional(),
});

/**
 * Payload Schemas for Primary Domain Events
 */

export const TaskEventPayloadSchema = z.object({
  taskId: z.string().uuid(),
  userId: z.string().uuid(),
  goalId: z.string().uuid().optional().nullable(),
  lifeAreaId: z.string().uuid().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'RESCHEDULED']),
  priority: z.number().int().min(1).max(5).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  skippedAt: z.string().datetime().optional().nullable(),
  rescheduledAt: z.string().datetime().optional().nullable(),
  rescheduleCount: z.number().int().nonnegative().optional(),
  actualDurationMinutes: z.number().int().positive().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const RoutineEventPayloadSchema = z.object({
  routineId: z.string().uuid(),
  userId: z.string().uuid(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expectedAt: z.string().datetime(),
  status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED', 'MISSED']),
  completedAt: z.string().datetime().optional().nullable(),
  skippedAt: z.string().datetime().optional().nullable(),
  actualDuration: z.number().int().positive().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const CheckinEventPayloadSchema = z.object({
  checkinId: z.string().uuid(),
  userId: z.string().uuid(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  energy: z.number().int().min(1).max(5).optional().nullable(),
  reflection: z.string().optional().nullable(),
  dayRating: z.number().int().min(1).max(5).optional().nullable(),
});

export const GoalProgressPayloadSchema = z.object({
  goalId: z.string().uuid(),
  metricId: z.string().uuid(),
  value: z.number(),
  observedAt: z.string().datetime(),
  source: z.string(),
  unit: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

export const UserRegisteredPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  timezone: z.string(),
  locale: z.string(),
});

export const InterventionEventPayloadSchema = z.object({
  interventionId: z.string().uuid(),
  insightId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['PROPOSED', 'ACCEPTED', 'COMPLETED', 'FAILED', 'DISMISSED']),
  decisionReason: z.string().optional().nullable(),
  outcome: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const MemoryEventPayloadSchema = z.object({
  memoryId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  summary: z.string(),
  sensitivity: z.enum(['NORMAL', 'SENSITIVE', 'RESTRICTED']),
  status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']),
});

/**
 * Event validator function: validates raw event against envelope and specific payload schema
 */
export function validateDomainEvent<T = Record<string, unknown>>(
  rawEvent: unknown,
  payloadSchema?: z.ZodType<T>,
): { success: true; data: Omit<z.infer<typeof EventEnvelopeSchema>, 'payload'> & { payload: T } } | { success: false; error: z.ZodError } {
  const envelopeResult = EventEnvelopeSchema.safeParse(rawEvent);
  if (!envelopeResult.success) {
    return { success: false, error: envelopeResult.error };
  }

  if (payloadSchema) {
    const payloadResult = payloadSchema.safeParse(envelopeResult.data.payload);
    if (!payloadResult.success) {
      return { success: false, error: payloadResult.error };
    }
    return {
      success: true,
      data: {
        ...envelopeResult.data,
        payload: payloadResult.data,
      },
    };
  }

  return {
    success: true,
    data: envelopeResult.data as unknown as Omit<z.infer<typeof EventEnvelopeSchema>, 'payload'> & { payload: T },
  };
}
