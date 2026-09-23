import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-store';

// ---------------------------------------------------------------------------
// Route matchers
// ---------------------------------------------------------------------------

/** Routes that require an active session. */
const PROTECTED_PREFIXES = ['/dashboard', '/goals', '/tasks', '/insights', '/settings'];

/** Routes that redirect authenticated users away (auth pages). */
const AUTH_PREFIXES = ['/login', '/register'];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Edge Middleware for SAAR.
 *
 * Performs a lightweight presence-check of the session cookie ONLY.
 * Full cryptographic validation happens in `lib/auth.ts` (server-side).
 * This keeps middleware latency minimal and within Edge constraints.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  // Protected route — no cookie → redirect to login
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!hasSessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth route — cookie present → redirect to dashboard
  if (AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - /api routes   (handled by their own Route Handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
