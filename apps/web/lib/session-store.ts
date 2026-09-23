/**
 * Session management for SAAR.
 *
 * The canonical session is an httpOnly cookie SET by the API server.
 * This module provides:
 *  - The authoritative cookie name constant.
 *  - Route Handler helpers to proxy session creation / destruction.
 *  - NEVER reads from or writes to localStorage / sessionStorage.
 */

import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Name of the httpOnly session cookie. Must match the API server config. */
export const SESSION_COOKIE_NAME = 'saar_session' as const;

/** Cookie options mirroring the API's set-cookie configuration. */
export const SESSION_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax',
  path: '/',
  // 7 days; the API controls the actual expiry — this is just the browser hint
  maxAge: 60 * 60 * 24 * 7,
};

// ---------------------------------------------------------------------------
// Cookie helpers (for Route Handlers / Server Actions)
// ---------------------------------------------------------------------------

/**
 * Build the Set-Cookie header value for the session cookie.
 * Used when the Next.js layer needs to set the cookie independently
 * (e.g., after proxying a login response).
 */
export function buildSessionCookieHeader(token: string): string {
  const opts = SESSION_COOKIE_OPTIONS;
  const parts: string[] = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=${opts.path ?? '/'}`,
    `SameSite=${opts.sameSite ?? 'Lax'}`,
  ];

  if (opts.maxAge !== undefined) {
    parts.push(`Max-Age=${opts.maxAge}`);
  }
  if (opts.httpOnly) {
    parts.push('HttpOnly');
  }
  if (opts.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

/**
 * Build the Set-Cookie header value to CLEAR the session cookie.
 * Call this when logging out via a Route Handler.
 */
export function buildClearSessionCookieHeader(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=0`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    process.env['NODE_ENV'] === 'production' ? 'Secure' : '',
    'HttpOnly',
  ]
    .filter(Boolean)
    .join('; ');
}

// ---------------------------------------------------------------------------
// Session state for Client Components
// ---------------------------------------------------------------------------

/**
 * Minimal session shape surfaced to the client via a non-sensitive API route.
 * Never includes tokens or sensitive fields.
 */
export interface ClientSession {
  userId: string;
  displayName: string;
  email: string;
  expiresAt: string;
}
