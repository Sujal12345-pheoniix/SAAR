/**
 * Shared TypeScript types for the SAAR web app.
 * API contract types — kept in sync with @saar/contracts.
 */

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  requestId?: string;
  statusCode: number;
}

export type ApiResult<T> =
  | { ok: true; data: T; statusCode: number }
  | { ok: false; error: ApiErrorResponse };

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface SessionPayload {
  user: SessionUser;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  /** Lucide-style icon name or SVG string */
  icon?: string;
}
