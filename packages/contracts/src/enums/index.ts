/**
 * Domain enums — mirror Prisma schema exactly so both ORM and API layers share one source of truth.
 * DO NOT import Prisma here; keep this package framework-agnostic.
 */

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum RoutineOccurrenceStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  MISSED = 'MISSED',
}

export enum InsightStatus {
  NEW = 'NEW',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  DISMISSED = 'DISMISSED',
  EXPIRED = 'EXPIRED',
}

export enum InterventionStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DISMISSED = 'DISMISSED',
}

export enum MemoryStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum NotificationStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum LifeAreaType {
  MIND = 'MIND',
  HEALTH = 'HEALTH',
  CAREER = 'CAREER',
  RELATIONSHIPS = 'RELATIONSHIPS',
  PERSONAL = 'PERSONAL',
  FINANCE = 'FINANCE',
  PURPOSE = 'PURPOSE',
}

export enum EventSource {
  MOBILE = 'MOBILE',
  WEB = 'WEB',
  SYSTEM = 'SYSTEM',
  INTEGRATION = 'INTEGRATION',
}

export enum ActorType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
}
