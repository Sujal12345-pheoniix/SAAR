import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-store';

/**
 * GET /api/auth/session
 *
 * Returns a minimal, non-sensitive session summary for Client Components.
 * Never exposes the raw session token — only safe user fields.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'No active session.' } },
      { status: 401 },
    );
  }

  const apiBase = (
    process.env['INTERNAL_API_URL'] ??
    process.env['NEXT_PUBLIC_API_URL'] ??
    (process.env['NODE_ENV'] === 'production'
      ? 'https://saar-a494.onrender.com/api/v1'
      : 'http://localhost:3001/api/v1')
  ).replace(/\/$/, '');

  try {
    const upstream = await fetch(`${apiBase}/auth/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Session expired or invalid.' } },
        { status: 401 },
      );
    }

    const data = (await upstream.json()) as unknown;
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Could not verify session.' } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/session
 *
 * Sets the session cookie on the Next.js domain (first-party).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body?.token;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
