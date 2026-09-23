import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

/**
 * Root page — immediately redirects based on auth state.
 *
 * Authenticated  →  /dashboard
 * Unauthenticated → /home  (public marketing landing)
 *
 * This page is never visible to users; it is a routing hub only.
 */
export default async function RootPage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  redirect('/home');
}
