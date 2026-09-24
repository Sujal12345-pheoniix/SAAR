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

/**
 * Validate the session token with the API server.
 * Returns the parsed session payload or null.
 */
async function validateSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/session`, {
      method: 'GET',
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        Accept: 'application/json',
      },
      // Bypass Next.js fetch cache — session must always be fresh
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const body = (await response.json()) as { data?: SessionPayload } | SessionPayload;

    // Handle both raw and enveloped responses
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as { data: SessionPayload }).data ?? null;
    }
    return body as SessionPayload;
  } catch {
    return null;
  }
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
