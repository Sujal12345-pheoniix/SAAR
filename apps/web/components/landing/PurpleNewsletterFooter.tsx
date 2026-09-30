'use client';

import Link from 'next/link';
import React, { useState } from 'react';

export function PurpleNewsletterFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="w-full bg-slate-900 text-white pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Top Row: Brand & Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-12 border-b border-slate-800">
          <Link href="/home" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm">
              S
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              SAAR
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-semibold text-slate-400">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#methodology" className="hover:text-white transition-colors">Methodology</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>

        {/* Middle Row: Newsletter Form Centered */}
        <div className="py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Stay Informed with SAAR Research
            </h3>
            <p className="text-sm text-slate-400 font-normal leading-relaxed max-w-sm">
              Read our monthly dispatches on behavioral economics, habit architectures, and cognitive focus.
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col sm:items-end">
            {subscribed ? (
              <div className="px-5 py-3 rounded-xl bg-slate-800 text-white text-xs font-semibold border border-slate-700">
                &bull; You are subscribed to SAAR reflections.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-md flex items-center bg-slate-800 rounded-xl p-1.5 border border-slate-700 shadow-sm"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className="flex-1 px-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 px-5 py-2.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-sm"
                >
                  Subscribe
                </button>
              </form>
            )}
            <div className="text-[11px] text-slate-500 mt-2 sm:text-right pr-2">
              We respect your inbox. Unsubscribe at any time.
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} SAAR. All rights reserved.
          </div>
          <div>
            Self-Aware Action & Reflection &bull; Personal Growth Intelligence
          </div>
        </div>
      </div>
    </footer>
  );
}
