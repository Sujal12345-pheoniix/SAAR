import { type NextRequest, NextResponse } from 'next/server';
import { buildClearSessionCookieHeader } from '@/lib/session-store';

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and optionally calls the API to invalidate the
 * server-side session.  Redirects the user to /login after logout.
 *
 * Called via the sign-out form in the app layout (method=POST keeps it CSRF-safe).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiBase =
    process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

  // Best-effort: tell the API to invalidate the session server-side.
  // We don't block on failure — the cookie clear is the authoritative action.
  try {
    await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });
  } catch {
    // Ignore — proceed with cookie deletion regardless
  }

  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303, // POST → redirect → GET
  });

  // Clear the session cookie
  response.headers.set('Set-Cookie', buildClearSessionCookieHeader());

  return response;
}
