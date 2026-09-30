'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, Activity } from 'lucide-react';
import React from 'react';

export function RoutineShowcase() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#FAF8F5] rounded-[40px] p-8 sm:p-12 lg:p-16 border border-purple-100/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column — Text & Editorial Description */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-5">
              <Sparkles size={12} />
              Deliberate Cadence
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-6">
              Take control of your <br />
              daily routines with ease.
            </h2>

            <p className="text-base text-zinc-600 leading-relaxed font-normal mb-8 max-w-xl">
              Whether you&rsquo;re just starting out or already deep into your self-improvement journey, SAAR offers honest insights and personalized coaching to keep you grounded. If you want to develop sustainable routines, eliminate planning friction, and understand your real capacity, this platform is built for you.
            </p>

            <div className="space-y-3 mb-8 w-full max-w-md">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-zinc-700 font-medium">Automatic habit stacking and RRULE recurrence</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-zinc-700 font-medium">Grace-period streak protection against binary guilt</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-zinc-700 font-medium">Timezone-aware local calendar calculations</span>
              </div>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-zinc-900 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              <span>Get Started For Free</span>
              <ArrowRight size={15} />
            </Link>
          </motion.div>

          {/* Right Column — Editorial Visual matching Image 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-tr from-purple-900 via-indigo-950 to-slate-900 aspect-[4/5] shadow-2xl flex flex-col justify-between p-6 sm:p-8 text-white">
              {/* Atmospheric Background Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-purple-600/30 to-transparent pointer-events-none" />

              {/* Top Floating Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
                  <Activity size={14} className="text-emerald-400" />
                  <span>Morning Cadence · 06:30 AM</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              </div>

              {/* Silhouette / Visual Illustration */}
              <div className="relative z-10 my-auto text-center py-8">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-400 to-amber-300 p-0.5 shadow-xl mb-4">
                  <div className="w-full h-full rounded-full bg-zinc-950/80 flex items-center justify-center text-3xl">
                    🏃‍♂️
                  </div>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  Clarity in Daily Action
                </div>
                <div className="text-xs text-purple-200/80 mt-1 max-w-xs mx-auto">
                  &ldquo;Action expresses priorities. How you spend your days is how you spend your life.&rdquo;
                </div>
              </div>

              {/* Bottom Habit Pill */}
              <div className="relative z-10 bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/20 flex items-center justify-between">
                <div>
                  <div className="text-xs text-purple-200">Daily Focus Target</div>
                  <div className="text-sm font-bold text-white">90 mins Deep Work + 5km Run</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                  Completed
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
