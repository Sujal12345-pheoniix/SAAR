import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '4rem auto', padding: '0 1.5rem', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
      <Link href="/register" style={{ color: '#6366f1', textDecoration: 'none' }}>&larr; Back to sign up</Link>
      <h1 style={{ marginTop: '1.5rem', fontSize: '2rem' }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280' }}>Last updated: September 2026</p>
      <p>Your privacy is respected. SAAR only stores data necessary to power your personal growth intelligence and goal tracking.</p>
    </div>
  );
}
