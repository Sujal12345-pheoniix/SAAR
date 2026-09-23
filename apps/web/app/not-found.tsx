import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
};

/**
 * Custom 404 — rendered by Next.js whenever notFound() is called or a route
 * doesn't match.  Keeps users oriented with navigation back to safety.
 */
export default function NotFound() {
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
      <div aria-hidden="true" style={{ fontSize: '3.5rem', lineHeight: 1 }}>
        🔍
      </div>

      <div style={{ maxWidth: '380px' }}>
        <p
          style={{
            fontSize: '5rem',
            fontWeight: 800,
            color: '#e5e7eb',
            lineHeight: 1,
            marginBottom: '0.25rem',
          }}
        >
          404
        </p>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '0.5rem',
          }}
        >
          Page not found
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/dashboard"
          style={{
            padding: '0.625rem 1.25rem',
            background: '#6366f1',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'transparent',
            color: '#6366f1',
            border: '1px solid #6366f1',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
