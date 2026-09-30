import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9FF] relative overflow-hidden aura-mesh-landing text-zinc-900">
      {/* Background Soft Organic Blurs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-purple-200/40 via-pink-100/30 to-indigo-100/30 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/20 blur-2xl rounded-full pointer-events-none -z-10" />

      {/* Top Header / Back Link */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-purple-700 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-purple-100 shadow-sm transition-all hover:shadow"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <Link href="/home" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            S
          </div>
          <span className="font-extrabold text-lg tracking-tight text-zinc-900">
            SAAR
          </span>
        </Link>
      </header>

      {/* Central Auth Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Bottom Footer note */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-zinc-400 z-10">
        <p>&copy; {new Date().getFullYear()} SAAR. Grounded personal growth intelligence.</p>
      </footer>
    </div>
  );
}
