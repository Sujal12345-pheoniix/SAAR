import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await requireAuth('/login');

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: 'var(--bg)',
      }}
    >
      <Sidebar
        userDisplayName={session.user.displayName}
        userEmail={session.user.email}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingTop: '0',
        }}
      >
        {/* Mobile top bar spacer */}
        <div className="lg:hidden" style={{ height: 60 }} />

        <main
          style={{
            flex: 1,
            padding: '2rem 1.5rem',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
