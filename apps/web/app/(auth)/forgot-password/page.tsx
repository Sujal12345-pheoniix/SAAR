import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
        Reset your password
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Password reset instructions will be sent to your email.
      </p>
      <Link href="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
        &larr; Back to sign in
      </Link>
    </div>
  );
}
