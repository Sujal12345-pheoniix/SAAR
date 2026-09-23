import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.375rem' }}>
          Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          Manage your account and preferences.
        </p>
      </div>

      {/* Settings sections shell */}
      {[
        { label: 'Profile', description: 'Update your display name and email.' },
        { label: 'Security', description: 'Change your password or enable two-factor authentication.' },
        { label: 'Notifications', description: 'Configure email and push notification preferences.' },
        { label: 'Data & Privacy', description: 'Export or delete your personal data.' },
      ].map(({ label, description }) => (
        <div
          key={label}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            marginBottom: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>{label}</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{description}</p>
          </div>
          <span
            style={{
              fontSize: '0.8125rem',
              color: '#9ca3af',
              background: '#f3f4f6',
              padding: '0.25rem 0.625rem',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            Phase 2
          </span>
        </div>
      ))}
    </div>
  );
}
