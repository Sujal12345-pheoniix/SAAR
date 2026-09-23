import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth layout — centered card with SAAR branding.
 * Wraps /login and /register.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9fafb 0%, #ede9fe 100%)',
        padding: '2rem 1rem',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Logo */}
      <Link
        href="/home"
        style={{
          fontWeight: 800,
          fontSize: '1.5rem',
          color: '#6366f1',
          textDecoration: 'none',
          letterSpacing: '-0.025em',
          marginBottom: '1.75rem',
          display: 'inline-block',
        }}
      >
        SAAR
      </Link>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)',
          padding: '2.5rem 2rem',
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: '1.5rem',
          fontSize: '0.8125rem',
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        &copy; {new Date().getFullYear()} SAAR
      </p>
    </div>
  );
}
