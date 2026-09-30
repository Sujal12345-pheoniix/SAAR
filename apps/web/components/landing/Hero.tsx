'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Target, Activity } from 'lucide-react';
import React from 'react';

export function Hero() {
  return (
    <section
      id="home"
      className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200 text-center relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Centered Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700 uppercase tracking-wider mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          Deliberate Growth Architecture
        </motion.div>

        {/* Master Headline Centered */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6"
        >
          Master Your Daily Habits with <br />
          <span className="text-blue-900">Data-Driven Intelligence</span>
        </motion.h1>

        {/* Subtitle Centered */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 font-normal"
        >
          Align your everyday actions with long-term goals. SAAR monitors consistency, momentum, and life balance through honest, deterministic behavioral reflection.
        </motion.p>

        {/* Centered Dual CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow transition-all"
          >
            <span>Begin Your Journey</span>
            <ArrowRight size={15} />
          </Link>

          <a
            href="#features"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm transition-all"
          >
            Explore Methodology
          </a>
        </motion.div>

        {/* Centered Desktop Interface Preview (Clean, Uncluttered, Fixed Padding) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-left"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workspace</span>
              <h3 className="text-lg font-bold text-slate-900">Today&rsquo;s Growth Architecture</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Optimal Rhythm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Focus Target</span>
                <Clock size={16} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">2h 15m</div>
                <div className="text-xs text-emerald-600 mt-1 font-medium">92% of daily objective</div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Habit Adherence</span>
                <Target size={16} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">4 of 5 Done</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">14-Day continuous streak</div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Life Equilibrium</span>
                <Activity size={16} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">Balanced</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Equal distribution across domains</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reassuring Values Strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Deterministic behavioral models</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Zero vanity gamification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Private and isolated data</span>
          </div>
        </div>
      </div>
    </section>
  );
}
