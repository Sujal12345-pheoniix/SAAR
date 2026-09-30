'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import React from 'react';

export function RoutineShowcase() {
  return (
    <section id="methodology" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-50 rounded-2xl p-8 sm:p-12 lg:p-16 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & Editorial Description */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700 uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Behavioral Cadence
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Take Control of Your <br />
              Daily Routines with Ease
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal mb-8 max-w-xl">
              Whether you are establishing a morning ritual or balancing demanding work sprints, SAAR surfaces real behavioral patterns to keep you grounded. Eliminate planning friction and focus on what genuinely moves you forward.
            </p>

            <div className="space-y-3.5 mb-8 w-full max-w-md">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 font-semibold">Automatic habit stacking and RRULE recurrence</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 font-semibold">1-day grace period to preserve momentum without binary guilt</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 font-semibold">Timezone-aware calendar aggregation</span>
              </div>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
            >
              <span>Begin Your Journey</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right Column: Clean Structured Overview Box */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rhythm Protocol</span>
                <span className="text-xs font-bold text-slate-900">Weekly Target</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Morning Cadence</div>
                    <div className="text-xs text-slate-500 mt-0.5">06:30 AM &bull; 45m Block</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Done (5/7)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Deep Work Window</div>
                    <div className="text-xs text-slate-500 mt-0.5">09:00 AM &bull; 90m Focus</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Done (6/7)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Evening Retrospective</div>
                    <div className="text-xs text-slate-500 mt-0.5">08:30 PM &bull; 15m Review</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
