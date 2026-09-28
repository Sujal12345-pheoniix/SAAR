/**
 * @saar/domain — pure business rules, scoring constants, and domain type definitions.
 *
 * Rules:
 *  - Zero framework dependencies (no NestJS, no Prisma, no Express).
 *  - Zero I/O. Everything here is a pure function or a constant.
 *  - Consumed by API, background workers, and shared packages.
 */

// ─── Life-area types ──────────────────────────────────────────────────────────

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

export function isValidLifeAreaType(value: string): value is LifeAreaType {
  return (LIFE_AREA_TYPES as readonly string[]).includes(value);
}

// ─── Mood & energy bounds ─────────────────────────────────────────────────────

export const MOOD_MIN = 1;
export const MOOD_MAX = 5;

export const ENERGY_MIN = 1;
export const ENERGY_MAX = 5;

export function isValidMood(v: number): boolean {
  return Number.isInteger(v) && v >= MOOD_MIN && v <= MOOD_MAX;
}

export function isValidEnergy(v: number): boolean {
  return Number.isInteger(v) && v >= ENERGY_MIN && v <= ENERGY_MAX;
}

// ─── Task priority bounds ─────────────────────────────────────────────────────

export const TASK_PRIORITY_MIN = 1;
export const TASK_PRIORITY_MAX = 5;

export function isValidPriority(v: number): boolean {
  return Number.isInteger(v) && v >= TASK_PRIORITY_MIN && v <= TASK_PRIORITY_MAX;
}

// ─── Default Weights & Streak Grace ───────────────────────────────────────────

export const DEFAULT_LIFE_AREA_WEIGHTS: Readonly<Record<LifeAreaType, number>> = {
  mind: 0.15,
  health: 0.20,
  career: 0.15,
  relationships: 0.15,
  personal: 0.10,
  finance: 0.10,
  purpose: 0.15,
} as const;

export const STREAK_GRACE_PERIOD_DAYS = 1;

export function isSameDay(isoA: string, isoB: string): boolean {
  const a = isoA.slice(0, 10);
  const b = isoB.slice(0, 10);
  return a === b;
}

export function daysBetween(isoA: string, isoB: string): number {
  const msPerDay = 86_400_000;
  const tsA = new Date(isoA).setUTCHours(0, 0, 0, 0);
  const tsB = new Date(isoB).setUTCHours(0, 0, 0, 0);
  return Math.abs(Math.round((tsB - tsA) / msPerDay));
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────
export * from './taxonomy/behavior-taxonomy';

// ─── Calendar ─────────────────────────────────────────────────────────────────
export * from './calendar/local-calendar';

// ─── Features ─────────────────────────────────────────────────────────────────
export * from './features/feature.types';
export * from './features/feature-extractors';

// ─── Signals ──────────────────────────────────────────────────────────────────
export * from './signals/signal.types';
export * from './signals/signal-calculators';

// ─── Gap Engine ───────────────────────────────────────────────────────────────
export * from './gap/gap.types';
export * from './gap/gap-engine';
