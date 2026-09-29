'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Compass } from 'lucide-react';

interface MonthlyReport {
  month: string;
  cycleOverview: string;
  whatChanged: string[];
  whatBecameEasier: string;
  whatStillFrictions: string;
  whatYouLearned: string;
  whatToTryNext: string;
  headlineMetric: { value: string; label: string; context: string };
}

const REPORTS: MonthlyReport[] = [
  {
    month: 'September 2026',
    cycleOverview: 'A month characterized by steady boundary consolidation and consistent aerobic recovery.',
    whatChanged: [
      '18 deliberate morning cardio sessions completed with zero skips.',
      'Evening shutdown buffer preserved on 22 of 28 tracked days.',
      'Deep architecture sprints scheduled exclusively before 11:30 AM.',
    ],
    whatBecameEasier:
      'Lacing up running shoes at 07:15 AM transitioned from an internal debate into an automatic morning baseline.',
    whatStillFrictions:
      'Unplanned late-night messages after 10:00 PM periodically elevate pre-sleep cognitive arousal.',
    whatYouLearned:
      'Willpower is a myth of brute force. When schedule capacity is protected, deliberate behavior happens naturally.',
    whatToTryNext:
      'Relocate the phone charging station outside the bedroom at 09:30 PM to eliminate late-night context re-entry.',
    headlineMetric: {
      value: '84%',
      label: 'Behavioral Consistency',
      context: '+14% compared to pre-SAAR baseline',
    },
  },
  {
    month: 'August 2026',
    cycleOverview: 'The foundation cycle: establishing honest capacity boundaries and clearing task clutter.',
    whatChanged: [
      'Daily planned tasks reduced from an unrealistic 14 items down to 4 high-leverage actions.',
      'First uninterrupted 10K endurance run recorded with controlled heart rate.',
      'Initiated daily unhurried 15-minute evening reflection check-ins.',
    ],
    whatBecameEasier:
      'Saying &ldquo;not today&rdquo; to non-critical inbound requests without feeling guilt or anxiety.',
    whatStillFrictions:
      'Transitioning directly from high-focus coding sprints into evening family dinner without a decompression runway.',
    whatYouLearned:
      'An overloaded schedule is often a defense mechanism against facing the few things that truly matter.',
    whatToTryNext:
      'Protect an immutable 20-minute walk between finishing craft work and opening the front door.',
    headlineMetric: {
      value: '72%',
      label: 'Schedule Realism',
      context: 'Overload days dropped from 18 to 4',
    },
  },
];

export function GrowthStorySection() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = REPORTS[selectedIdx] || REPORTS[0];

  return (
    <section id="growth-story" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="max-w-2xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#226949] bg-[rgba(34,105,73,0.08)] mb-3">
          05 • What Changed?
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#0F1115] tracking-tight leading-tight">
          Your story of change, <br />
          <span className="italic font-normal text-[#226949]">not an analytics dashboard.</span>
        </h2>
        <p className="text-base sm:text-lg text-[#495057] mt-4 leading-relaxed font-interface">
          Personal evolution cannot be reduced to bar charts and streak counters. SAAR synthesizes your behavioral evidence into an editorial personal retrospective.
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-[#F5F2EB] border border-[rgba(15,17,21,0.06)] w-fit">
        {REPORTS.map((r, i) => (
          <button
            key={r.month}
            onClick={() => setSelectedIdx(i)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedIdx === i
                ? 'bg-[#FFFFFF] text-[#0F1115] shadow-sm font-semibold'
                : 'text-[#495057] hover:text-[#0F1115]'
            }`}
          >
            {r.month}
          </button>
        ))}
      </div>

      {/* Editorial Report Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.month}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.08)] p-6 sm:p-10 shadow-sm"
        >
          {/* Headline Banner */}
          <div className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-[rgba(15,17,21,0.06)]">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
                Monthly Synthesis • {current.month}
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0F1115] mt-1.5 leading-snug">
                &ldquo;{current.cycleOverview}&rdquo;
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.06)] text-right">
              <span className="text-3xl font-editorial font-bold text-[#226949] tabular-nums">
                {current.headlineMetric.value}
              </span>
              <div className="text-xs font-semibold text-[#0F1115] mt-0.5">
                {current.headlineMetric.label}
              </div>
              <div className="text-[11px] text-[#868E96] mt-0.5">
                {current.headlineMetric.context}
              </div>
            </div>
          </div>

          {/* The 5 Editorial Chapters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            {/* 1. What Changed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#226949]">
                <CheckCircle2 size={15} />
                01 • What Changed In Practice
              </div>
              <ul className="space-y-2.5">
                {current.whatChanged.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.04)] text-sm text-[#0F1115] leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="text-[#226949] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. What Became Easier */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4D5091]">
                <Sparkles size={15} />
                02 • What Became Easier
              </div>
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.04)] text-sm text-[#0F1115] leading-relaxed font-editorial font-medium italic">
                &ldquo;{current.whatBecameEasier}&rdquo;
              </div>

              {/* 3. What Still Creates Friction */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
                  <AlertCircle size={15} />
                  03 • What Still Creates Friction
                </div>
                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.04)] text-sm text-[#495057] leading-relaxed">
                  {current.whatStillFrictions}
                </div>
              </div>
            </div>

            {/* 4. What You Learned */}
            <div className="p-6 rounded-2xl bg-[#F5F2EB] border border-[rgba(15,17,21,0.06)] space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
                04 • Core Behavioral Insight
              </div>
              <h4 className="font-editorial text-lg font-bold text-[#0F1115]">
                {current.whatYouLearned}
              </h4>
              <p className="text-xs text-[#868E96] pt-1">
                Synthesized by analyzing trade-offs across 30 days of timestamped execution.
              </p>
            </div>

            {/* 5. What To Try Next */}
            <div className="p-6 rounded-2xl bg-[#0F1115] text-[#FAF8F5] space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#226949]">
                05 • Deliberate Experiment for Next Month
              </div>
              <h4 className="font-editorial text-lg font-bold text-[#FAF8F5]">
                {current.whatToTryNext}
              </h4>
              <p className="text-xs text-[#C5CCD3] pt-1">
                A single gentle tweak designed to close the remaining behavioral gap.
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
