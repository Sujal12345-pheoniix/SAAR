/**
 * Auth-related request/response DTOs.
 * All timestamps are ISO-8601 strings — no `Date` objects to keep the package serialisation-agnostic.
 */

import type { UserStatus } from '../enums/index.js';

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  /** Optional display name set at registration time. */
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ─── Shared sub-shapes ────────────────────────────────────────────────────────

/**
 * Safe public projection of a User row — never includes password or internal fields.
 */
export interface UserPublic {
  id: string;
  email: string;
  status: UserStatus;
  timezone: string;
  locale: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

/**
 * Metadata about a single authenticated session.
 */
export interface SessionInfo {
  id: string;
  deviceId?: string;
  userAgent?: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 expiry timestamp. */
  expiresAt: string;
  /** `true` when this session corresponds to the token used to make the current request. */
  isCurrent?: boolean;
}

/**
 * Access + refresh token pair returned after a successful auth operation.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
}

// ─── Response bodies ──────────────────────────────────────────────────────────

export interface RegisterResponse {
  user: UserPublic;
  session: TokenPair;
}

export interface LoginResponse {
  user: UserPublic;
  session: TokenPair;
}

export interface RefreshResponse {
  session: TokenPair;
}

export interface SessionsResponse {
  sessions: SessionInfo[];
}
