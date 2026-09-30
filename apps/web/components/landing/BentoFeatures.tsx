'use client';

import { motion } from 'framer-motion';
import { Target, CheckCircle2, TrendingUp, Compass, ArrowRight, ShieldCheck } from 'lucide-react';
import React from 'react';

export function BentoFeatures() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header Centered */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Core Capabilities
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Engineered for Clarity, Daily Focus, and Lasting Change
          </h2>

          <p className="text-base text-slate-600 font-normal leading-relaxed">
            Turn abstract ambitions into continuous daily execution with deterministic behavioral intelligence.
          </p>
        </div>

        {/* 3 Symmetrical, Perfectly Padded Navy & White Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Habit Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold mb-6">
                <Target size={20} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                Habit Architecture & Stacking
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Define recurring cadences with RFC 5545 RRULE precision. Protect consistency with 1-day grace periods that prevent binary guilt.
              </p>
            </div>

            {/* Structured Card Content fitting text cleanly */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>Deep Work Focus (90m)</span>
                </div>
                <span className="text-slate-400">09:00 AM</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>Movement & Sunlight</span>
                </div>
                <span className="text-slate-400">11:30 AM</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  <span>Evening Reflection</span>
                </div>
                <span className="text-slate-400">08:00 PM</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Deterministic Reflection */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold mb-6">
                <TrendingUp size={20} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                Deterministic Signal Engine
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Calculate genuine behavioral signals across 7-day and 30-day windows. Identify friction, optimism bias, and execution gaps before they compound.
              </p>
            </div>

            {/* Clean Metrics Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Consistency Signal</span>
                <span className="font-bold text-slate-900">92% &bull; Established</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-900 h-full w-[92%] rounded-full" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Execution Friction</span>
                <span className="font-bold text-emerald-600">Low (&lt; 8%)</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[8%] rounded-full" />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Life Area Equilibrium */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold mb-6">
                <Compass size={20} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                Life Domain Equilibrium
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Maintain balance across Health, Craft, Mind, and Relationships. Detect over-concentration early to prevent burnout and neglected priorities.
              </p>
            </div>

            {/* Clean Progress Breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Craft & Career</span>
                <span className="font-bold text-slate-900">40%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Health & Vitality</span>
                <span className="font-bold text-slate-900">30%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Mind & Recovery</span>
                <span className="font-bold text-slate-900">20%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Relationships</span>
                <span className="font-bold text-slate-900">10%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
