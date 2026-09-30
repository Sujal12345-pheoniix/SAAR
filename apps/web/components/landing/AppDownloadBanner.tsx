'use client';

import Link from 'next/link';
import { Apple, Play, ArrowRight, ShieldCheck } from 'lucide-react';
import React from 'react';

export function AppDownloadBanner() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-900 rounded-3xl p-10 sm:p-14 text-white text-center flex flex-col items-center shadow-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 uppercase tracking-wider mb-6">
            <ShieldCheck size={14} className="text-blue-400" />
            Universal Synchronized Access
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Build Better Habits on Web and Mobile
          </h2>

          <p className="text-base text-slate-300 font-normal leading-relaxed max-w-xl mb-10">
            Track your morning rituals, reflect on your energy, and monitor your long-term goals anywhere with instant encrypted synchronization.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-sm transition-all"
            >
              <span>Get Started on Web</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <Apple size={18} />
              <span>iOS & Android Ready</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
