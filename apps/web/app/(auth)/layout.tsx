import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      {/* Top Header / Back Link */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <Link href="/home" className="inline-flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            S
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            SAAR
          </span>
        </Link>
      </header>

      {/* Central Auth Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} SAAR &bull; Personal Growth Intelligence &bull; All rights reserved.</p>
      </footer>
    </div>
  );
}
