import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Insights' };

export default function InsightsPage() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.375rem' }}>
          Insights
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          AI-powered patterns and trends from your data.
        </p>
      </div>
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
        <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
          Insights — coming in Phase 2
        </p>
        <p style={{ fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
          Intelligent, personalised insights generated from your habits and goals.
        </p>
      </div>
    </div>
  );
}
