import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Goals' };

export default function GoalsPage() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.375rem' }}>
          Goals
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          Define and track your long-term and short-term goals.
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
        <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
          Goals — coming in Phase 2
        </p>
        <p style={{ fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
          Create, prioritise, and track progress on all your goals here.
        </p>
      </div>
    </div>
  );
}
