import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SAAR — Personal Growth Intelligence',
  description:
    'Know how you live. Understand where you\'re going. Become who you want to be.',
};

/**
 * Marketing landing page shell.
 * Full content / animations come in Phase 2.
 */
export default function PublicHomePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* ---- Nav ---- */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
        }}
      >
        <span
          style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', color: '#111827' }}
        >
          SAAR
        </span>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: '#6366f1',
              textDecoration: 'none',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #6366f1',
            }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: '#fff',
              textDecoration: 'none',
              padding: '0.4rem 0.875rem',
              borderRadius: '6px',
              background: '#6366f1',
            }}
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* ---- Hero ---- */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f9fafb 0%, #ede9fe 100%)',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: '#ede9fe',
            color: '#7c3aed',
            fontSize: '0.8125rem',
            fontWeight: 600,
            padding: '0.3rem 0.875rem',
            borderRadius: '999px',
            marginBottom: '1.75rem',
            letterSpacing: '0.025em',
          }}
        >
          <span aria-hidden="true">✦</span>
          Personal Growth Intelligence
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#111827',
            maxWidth: '760px',
            marginBottom: '1.25rem',
          }}
        >
          SAAR &mdash;{' '}
          <span style={{ color: '#6366f1' }}>Personal Growth</span>{' '}
          Intelligence
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: '#4b5563',
            maxWidth: '560px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          Know how you live.&nbsp; Understand where you&apos;re going.&nbsp;
          Become who you want to be.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/register"
            style={{
              padding: '0.875rem 2rem',
              background: '#6366f1',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px 0 rgba(99,102,241,0.35)',
            }}
          >
            Start for free
          </Link>
          <Link
            href="/login"
            style={{
              padding: '0.875rem 2rem',
              background: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ---- Feature pillars (shell) ---- */}
      <section
        style={{
          padding: '4rem 2rem',
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
          }}
        >
          {[
            {
              emoji: '📊',
              title: 'Track',
              body: 'Log daily habits, tasks, and reflections in seconds.',
            },
            {
              emoji: '🎯',
              title: 'Goals',
              body: 'Set meaningful goals and watch your progress unfold.',
            },
            {
              emoji: '💡',
              title: 'Insights',
              body: 'AI-powered patterns surface what moves the needle for you.',
            },
          ].map(({ emoji, title, body }) => (
            <div
              key={title}
              style={{
                padding: '1.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{emoji}</div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: '1.0625rem',
                  color: '#111827',
                  marginBottom: '0.375rem',
                }}
              >
                {title}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer
        style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.8125rem',
          background: '#f9fafb',
        }}
      >
        &copy; {new Date().getFullYear()} SAAR. All rights reserved.
      </footer>
    </main>
  );
}
