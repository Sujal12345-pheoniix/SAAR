import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: '4rem auto', padding: '0 1.5rem', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
      <Link href="/register" style={{ color: '#6366f1', textDecoration: 'none' }}>&larr; Back to sign up</Link>
      <h1 style={{ marginTop: '1.5rem', fontSize: '2rem' }}>Terms of Service</h1>
      <p style={{ color: '#6b7280' }}>Last updated: September 2026</p>
      <p>By using SAAR, you agree to these terms. All features are provided for personal development and growth planning.</p>
    </div>
  );
}
