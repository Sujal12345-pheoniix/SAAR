import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import type { NavItem } from '@/types';
import { SidebarNav } from '@/components/sidebar-nav';

interface AppLayoutProps {
  children: React.ReactNode;
}

/** Navigation items — order matters; rendered top-to-bottom in the sidebar. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Goals',     href: '/goals',     icon: 'target' },
  { label: 'Tasks',     href: '/tasks',     icon: 'check-square' },
  { label: 'Insights',  href: '/insights',  icon: 'bar-chart-2' },
  { label: 'Settings',  href: '/settings',  icon: 'settings' },
];

/**
 * Authenticated app shell layout.
 *
 * - Calls `requireAuth()` — server-side session check.  Redirects to /login
 *   if no valid session cookie is found.
 * - Renders the sidebar nav + main content area.
 */
export default async function AppLayout({ children }: AppLayoutProps) {
  // Server-side auth guard — throws redirect if unauthenticated
  const session = await requireAuth('/login');

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        background: '#f9fafb',
      }}
    >
      {/* ---- Sidebar ---- */}
      <SidebarNav items={NAV_ITEMS} userDisplayName={session.user.displayName} />

      {/* ---- Main content ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0.875rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            background: '#fff',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {session.user.email}
          </span>
          {/* Log out via form POST to keep server-side cookie deletion clean */}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              Sign out
            </button>
          </form>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
