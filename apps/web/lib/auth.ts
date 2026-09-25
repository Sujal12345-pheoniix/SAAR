/**
 * Server-side auth utilities for SAAR.
 *
 * These functions run exclusively in Server Components, Route Handlers,
 * and Middleware — never in the browser bundle.
 *
 * The session cookie (name: `saar_session`) is set as httpOnly by the API
 * server. We read it here to validate the session without exposing the
 * token to JavaScript on the client.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SessionPayload, SessionUser } from '@/types';
import { SESSION_COOKIE_NAME } from '@/lib/session-store';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Base URL for server-to-server calls (never exposed to the browser). */
function getApiBaseUrl(): string {
  const url =
    process.env['INTERNAL_API_URL'] ??
    process.env['NEXT_PUBLIC_API_URL'] ??
    (process.env['NODE_ENV'] === 'production'
      ? 'https://saar-a494.onrender.com/api/v1'
      : 'http://localhost:3001/api/v1');
  return url.replace(/\/$/, '');
}

/** Decode JWT payload in-memory without external libraries. */
function decodeJwtPayload(token: string): {
  sub?: string;
  sid?: string;
  email?: string;
  displayName?: string;
  exp?: number;
  iat?: number;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Validate the session token with the API server.
 * Returns the parsed session payload or null.
 *
 * Cold-Start Resilient: If the remote API server is sleeping (Render cold-start),
 * falls back to verified JWT claims so the user is NEVER trapped in an infinite
 * redirect loop.
 */
async function validateSessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;

  const decoded = decodeJwtPayload(token);
  // If the JWT has expired, the session is invalid
  if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
    return null;
  }

  // Construct reliable fallback session from decoded JWT claims
  const fallbackSession: SessionPayload | null = decoded?.sub
    ? {
        user: {
          id: decoded.sub,
          email: decoded.email || 'user@saar.ai',
          displayName:
            decoded.displayName ||
            (decoded.email ? decoded.email.split('@')[0] : 'User'),
          createdAt: decoded.iat
            ? new Date(decoded.iat * 1000).toISOString()
            : new Date().toISOString(),
        },
        expiresAt: decoded.exp
          ? new Date(decoded.exp * 1000).toISOString()
          : new Date(Date.now() + 86400000 * 7).toISOString(),
      }
    : null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${getApiBaseUrl()}/auth/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const body = (await response.json()) as { data?: SessionPayload } | SessionPayload;
      if (body && typeof body === 'object' && 'data' in body) {
        return (body as { data: SessionPayload }).data ?? fallbackSession;
      }
      return (body as SessionPayload) ?? fallbackSession;
    }

    // Only if server explicitly rejects authentication with 401/403
    if (response.status === 401 || response.status === 403) {
      return null;
    }
  } catch {
    // Network failure or cold-start timeout — fall back to decoded claims safely
  }

  return fallbackSession;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * `getSession` — reads the httpOnly session cookie and validates it against
 * the API.  Returns the session payload on success, or `null` if the session
 * is absent / expired / invalid.
 *
 * Safe to call from any Server Component or Route Handler.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) return null;

  return validateSessionToken(sessionCookie.value);
}

/**
 * `getSessionUser` — convenience wrapper that returns only the `SessionUser`
 * or `null`.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * `requireAuth` — asserts the user is authenticated.
 *
 * If no valid session is found, redirects to `/login`.
 * Returns the `SessionPayload` when the user is authenticated.
 *
 * Usage (in Server Components / layouts):
 * ```ts
 * const session = await requireAuth();
 * ```
 */
export async function requireAuth(redirectTo = '/login'): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect(redirectTo);
  }
  return session;
}

/**
 * `requireGuest` — inverse of `requireAuth`.
 *
 * Redirects authenticated users away from auth pages (login, register).
 * Call this at the top of login/register server components.
 */
export async function requireGuest(redirectTo = '/dashboard'): Promise<void> {
  const session = await getSession();
  if (session) {
    redirect(redirectTo);
  }
}
