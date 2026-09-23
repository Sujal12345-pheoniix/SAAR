'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js App Router error boundary.
 *
 * - Receives the raw Error object on the client.
 * - Never renders stack traces to users (security + UX).
 * - Logs the error to the console (replace with your error tracker).
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Replace with Sentry / Datadog / your tracker in production
    console.error('[SAAR] Unhandled error:', error.digest ?? error.message);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '2rem',
        textAlign: 'center',
        gap: '1.5rem',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        aria-hidden="true"
        style={{ fontSize: '3.5rem', lineHeight: 1 }}
      >
        ⚠️
      </div>

      <div style={{ maxWidth: '420px' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '0.5rem',
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          An unexpected error occurred. Our team has been notified. Please try
          again, or return to the home page if the problem persists.
        </p>
        {error.digest && (
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: '#9ca3af',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.625rem 1.25rem',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'transparent',
            color: '#6366f1',
            border: '1px solid #6366f1',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
}
