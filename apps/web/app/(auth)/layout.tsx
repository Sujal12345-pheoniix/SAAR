import type { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        background: 'var(--bg)',
      }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{
          width: '420px',
          flexShrink: 0,
          background: 'linear-gradient(145deg, #0B1020 0%, #1a1f3a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(99,102,241,0.2) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Particle dots */}
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: '50%',
              background: `rgba(99,102,241,${0.2 + (i % 5) * 0.08})`,
              left: `${(i * 37) % 90 + 5}%`,
              top: `${(i * 53) % 90 + 5}%`,
            }}
          />
        ))}

        <div className="relative z-10">
          <Link href="/home" style={{ textDecoration: 'none' }}>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
                  <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="1" opacity="0.25"/>
                  <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#fff', letterSpacing: '-0.02em' }}>SAAR</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '1rem' }}>
            Your life.<br />
            <span style={{ color: '#818CF8' }}>Decoded.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            Turn your daily habits, goals, and reflections into a living intelligence map of who you&apos;re becoming.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2.5rem' }}>
            {[
              { icon: '🧠', text: 'Behavioral pattern recognition' },
              { icon: '🎯', text: 'Goal alignment tracking' },
              { icon: '💡', text: 'AI-powered personal insights' },
            ].map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', position: 'relative', zIndex: 10 }}>
          &copy; {new Date().getFullYear()} SAAR
        </p>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
