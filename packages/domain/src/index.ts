/**
 * @saar/domain — pure business rules, scoring constants, and domain type definitions.
 *
 * Rules:
 *  - Zero framework dependencies (no NestJS, no Prisma, no Express).
 *  - Zero I/O.  Everything here is a pure function or a constant.
 *  - Consumed by both the API layer and any future serverless scoring functions.
 */

// ─── Life-area types ──────────────────────────────────────────────────────────

/**
 * Ordered tuple of all valid life-area slugs.
 * Use `LifeAreaType` for type-narrowing and `LIFE_AREA_TYPES` for iteration / validation.
 */
export const LIFE_AREA_TYPES = [
  'mind',
  'health',
  'career',
  'relationships',
  'personal',
  'finance',
  'purpose',
] as const;

export type LifeAreaType = (typeof LIFE_AREA_TYPES)[number];

/**
 * Returns `true` when `value` is a valid `LifeAreaType`.
 */
export function isValidLifeAreaType(value: string): value is LifeAreaType {
  return (LIFE_AREA_TYPES as readonly string[]).includes(value);
}

// ─── Mood & energy bounds ─────────────────────────────────────────────────────

export const MOOD_MIN = 1;
export const MOOD_MAX = 5;

export const ENERGY_MIN = 1;
export const ENERGY_MAX = 5;

/**
 * Returns `true` when `v` is an integer in the valid mood range [1 – 5].
 */
export function isValidMood(v: number): boolean {
  return Number.isInteger(v) && v >= MOOD_MIN && v <= MOOD_MAX;
}

/**
 * Returns `true` when `v` is an integer in the valid energy range [1 – 5].
 */
export function isValidEnergy(v: number): boolean {
  return Number.isInteger(v) && v >= ENERGY_MIN && v <= ENERGY_MAX;
}

// ─── Task priority bounds ─────────────────────────────────────────────────────

export const TASK_PRIORITY_MIN = 1;
export const TASK_PRIORITY_MAX = 5;

/**
 * Returns `true` when `v` is an integer in the valid priority range [1 – 5].
 */
export function isValidPriority(v: number): boolean {
  return Number.isInteger(v) && v >= TASK_PRIORITY_MIN && v <= TASK_PRIORITY_MAX;
}

// ─── Behaviour event type allowlist ──────────────────────────────────────────

/**
 * Exhaustive list of event type strings that are valid behaviour signals.
 * Any incoming event whose `type` is not in this list MUST be rejected before
 * it reaches the scoring or insight engines.
 */
export const BEHAVIOR_EVENT_TYPES = [
  'task.completed',
  'task.skipped',
  'task.snoozed',
  'task.cancelled',
  'routine.completed',
  'routine.skipped',
  'checkin.completed',
  'alarm.dismissed',
  'goal.created',
  'goal.completed',
  'goal.paused',
  'goal.archived',
] as const;

export type BehaviorEventType = (typeof BEHAVIOR_EVENT_TYPES)[number];

/**
 * Type-guard — returns `true` and narrows the type when `t` is a recognised behaviour event.
 */
export function isValidBehaviorEventType(t: string): t is BehaviorEventType {
  return (BEHAVIOR_EVENT_TYPES as readonly string[]).includes(t);
}

// ─── Scoring weights (Phase 1 baseline) ──────────────────────────────────────

/**
 * Default relative weights used by the SAAR scoring engine when no personalised
 * weights have been calibrated for a user.  Values are normalised to sum to 1.
 */
export const DEFAULT_LIFE_AREA_WEIGHTS: Readonly<Record<LifeAreaType, number>> = {
  mind: 0.15,
  health: 0.20,
  career: 0.15,
  relationships: 0.15,
  personal: 0.10,
  finance: 0.10,
  purpose: 0.15,
} as const;

// ─── Streak helpers ───────────────────────────────────────────────────────────

/**
 * Maximum number of days a streak can survive without a qualifying event
 * before it resets to zero.
 */
export const STREAK_GRACE_PERIOD_DAYS = 1;

/**
 * Returns `true` when two ISO-8601 date strings are on the same calendar day
 * (in the user's local timezone, expressed via offset).
 *
 * NOTE: For production use, prefer a timezone-aware comparison using the user's
 * IANA timezone string.  This utility compares UTC dates for simplicity.
 */
export function isSameDay(isoA: string, isoB: string): boolean {
  const a = isoA.slice(0, 10); // "YYYY-MM-DD"
  const b = isoB.slice(0, 10);
  return a === b;
}

/**
 * Returns the difference in whole calendar days between two ISO-8601 date strings.
 * Result is always non-negative.
 */
export function daysBetween(isoA: string, isoB: string): number {
  const msPerDay = 86_400_000;
  const tsA = new Date(isoA).setUTCHours(0, 0, 0, 0);
  const tsB = new Date(isoB).setUTCHours(0, 0, 0, 0);
  return Math.abs(Math.round((tsB - tsA) / msPerDay));
}
