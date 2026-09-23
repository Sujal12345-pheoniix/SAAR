import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Dashboard page shell.
 * Full widgets / data visualizations land in Phase 2.
 */
export default function DashboardPage() {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.375rem' }}
        >
          Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          Your personal growth overview at a glance.
        </p>
      </div>

      {/* Phase 2 placeholder card */}
      <div
        style={{
          background: '#fff',
          border: '1px dashed #d1d5db',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: '#9ca3af',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
          SAAR Dashboard coming in Phase 2
        </p>
        <p style={{ fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
          Habit tracking, goal progress, AI insights, and weekly summaries will
          appear here once Phase 2 features are implemented.
        </p>
      </div>

      {/* Placeholder stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {['Goals', 'Tasks due today', 'Streak', 'Insights'].map((label) => (
          <div
            key={label}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 500 }}>
              {label}
            </span>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#e5e7eb',
              }}
            >
              —
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
