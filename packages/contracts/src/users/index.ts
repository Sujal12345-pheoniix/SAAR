/**
 * User profile DTOs.
 * Re-uses `UserPublic` from auth to avoid duplication.
 */

import type { UserPublic } from '../auth/index.js';

// ─── Sub-shapes ───────────────────────────────────────────────────────────────

/**
 * Extended profile data associated with a user (one-to-one with User row).
 */
export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  /** Arbitrary user preferences stored as a JSON object. */
  preferences?: Record<string, unknown>;
}

// ─── Response bodies ──────────────────────────────────────────────────────────

/**
 * Response from `GET /users/me` — returns the authenticated user plus their profile.
 */
export interface MeResponse {
  user: UserPublic;
  /** `null` when the profile record has not yet been created. */
  profile: UserProfile | null;
}

// ─── Request bodies ───────────────────────────────────────────────────────────

/**
 * Partial update applied to the authenticated user's core record.
 */
export interface UpdateMeRequest {
  displayName?: string;
  /** IANA timezone string, e.g. `"Asia/Kolkata"`. */
  timezone?: string;
  /** BCP-47 locale string, e.g. `"en-IN"`. */
  locale?: string;
}

/**
 * Replace the authenticated user's preferences JSON blob.
 */
export interface UpdatePreferencesRequest {
  preferences: Record<string, unknown>;
}
