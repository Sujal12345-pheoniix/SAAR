/**
 * Global loading UI — shown by Next.js while a page segment is streaming.
 * Inline styles keep this dependency-free and fast to paint.
 */
export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-label="Loading…"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '1rem',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* CSS-only spinner — no JS animation dependency */}
      <style>{`
        @keyframes saar-spin {
          to { transform: rotate(360deg); }
        }
        .saar-spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: saar-spin 0.7s linear infinite;
        }
      `}</style>
      <div className="saar-spinner" />
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading…</p>
    </div>
  );
}
