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

function isTokenExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Edge Middleware for SAAR.
 *
 * Performs a lightweight presence and expiration check of the session cookie.
 * Full cryptographic validation happens in `lib/auth.ts` (server-side).
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname, searchParams } = request.nextUrl;
  const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const expired = isTokenExpired(rawCookie);
  const hasValidSession = Boolean(rawCookie && !expired);

  // Protected route — no valid session → clear invalid cookie & redirect to login
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!hasValidSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const response = NextResponse.redirect(loginUrl);
      if (rawCookie) {
        response.cookies.delete(SESSION_COOKIE_NAME);
      }
      return response;
    }
  }

  // Auth route — valid session present → redirect to dashboard
  if (AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (rawCookie && expired) {
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    if (hasValidSession && !searchParams.has('logout') && !searchParams.has('force')) {
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
