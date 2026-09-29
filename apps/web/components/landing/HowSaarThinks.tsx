'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Eye, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

interface TransformationCase {
  id: string;
  title: string;
  lifeArea: string;
  rawReality: {
    planned: string;
    actual: string;
    friction: string;
  };
  patternDetected: string;
  evidencePoints: { label: string; metric: string; detail: string }[];
  proposedExperiment: {
    headline: string;
    action: string;
    expectedOutcome: string;
  };
}

const CASES: TransformationCase[] = [
  {
    id: 'case-workload',
    title: 'The High-Workload Paradox',
    lifeArea: 'Health & Career',
    rawReality: {
      planned: '5 strength & Zone 2 cardio sessions scheduled this week.',
      actual: '3 completed on Monday, Wednesday, and Saturday.',
      friction: 'Tuesday and Thursday workouts skipped after 9.5-hour engineering sprints.',
    },
    patternDetected:
      'Your consistency drops noticeably on days where cognitive load exceeds 8.5 hours. It is not an issue of motivation; your nervous system lacks an evening shutdown buffer.',
    evidencePoints: [
      { label: 'Workload Threshold', metric: '>8.5h work', detail: 'Consistent drop in physical readiness' },
      { label: 'Heart Rate Variability', metric: '-18ms dip', detail: 'Elevated sympathetic tone at 7:30 PM' },
      { label: 'Historical Baseline', metric: '6 cycles analyzed', detail: 'Pattern repeated across 8 of 10 prior weeks' },
    ],
    proposedExperiment: {
      headline: 'Protect a 30-minute recovery buffer before evening exercise',
      action: 'Shift workout to 07:30 AM or introduce a mandatory 20m zero-screen transition ritual before training.',
      expectedOutcome: 'Substantially higher habit completion rate without increasing perceived exertion.',
    },
  },
  {
    id: 'case-sleep-focus',
    title: 'Sleep Depth & Deep Focus Resonance',
    lifeArea: 'Mind & Craft',
    rawReality: {
      planned: '4 deep architecture design blocks (90 min each) scheduled.',
      actual: '2 completed successfully; 2 abandoned midway due to context fatigue.',
      friction: 'Both abandoned sessions occurred following nights with under 6.5 hours of sleep.',
    },
    patternDetected:
      'High-complexity synthesis requires sustained prefrontal reserve. When sleep falls below 7 hours, your threshold for distraction drops by half.',
    evidencePoints: [
      { label: 'Sleep Boundary', metric: '<6.5h sleep', detail: 'Task abandonment rate jumps from 8% to 46%' },
      { label: 'Time to First Distraction', metric: '14 min vs 48 min', detail: 'Measured during complex analytical tasks' },
      { label: 'Recovery Correlation', metric: 'r = 0.82', detail: 'Strong correlation between deep sleep and sprint success' },
    ],
    proposedExperiment: {
      headline: 'Front-load complex architecture blocks to morning windows',
      action: 'Schedule heavy analytical work between 09:30 AM and 11:30 AM; reserve afternoons for async collaboration.',
      expectedOutcome: 'Significantly higher deep work sprint completion rate with sustainable cognitive reserve.',
    },
  },
  {
    id: 'case-values-drift',
    title: 'Stated Priorities vs Actual Calendar',
    lifeArea: 'Relationships & Purpose',
    rawReality: {
      planned: 'Future Self identity: "A calm, present partner and unhurried mentor."',
      actual: '18 back-to-back calendar meetings logged; 0 unhurried conversations.',
      friction: 'Arrived at family dinner cognitively exhausted, mentally still checking Slack.',
    },
    patternDetected:
      'There is a persistent structural gap between your desired identity and your calendar allocation. Secondary obligations are quietly consuming primary life areas.',
    evidencePoints: [
      { label: 'Calendar Congestion', metric: '88% booked', detail: 'Less than 15 min transition buffer between meetings' },
      { label: 'Presence Score', metric: '2.4 / 5.0 self-rating', detail: 'Check-in data indicates frequent divided attention' },
      { label: 'Priority Inversion', metric: '12 hours on low-impact comms', detail: 'Outweighs time allocated to core relationships' },
    ],
    proposedExperiment: {
      headline: 'Institute an untouchable Friday afternoon sanctuary block',
      action: 'Block 2:00 PM to 4:00 PM every Friday for unhurried mentoring, reading, or family time.',
      expectedOutcome: 'Immediate restoration of intentional alignment between stated values and real life.',
    },
  },
];

export function HowSaarThinks() {
  const [selectedCaseId, setSelectedCaseId] = useState('case-workload');
  const [showEvidence, setShowEvidence] = useState(false);

  const activeCase = CASES.find((c) => c.id === selectedCaseId) || CASES[0];

  return (
    <section id="how-it-thinks" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Section Header */}
      <div className="max-w-2xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#226949] bg-[rgba(34,105,73,0.08)] mb-3">
          <span>03 • What Does SAAR Notice?</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-800 font-medium normal-case">Illustrative Demo</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#0F1115] tracking-tight leading-tight">
          Intelligence you can <br />
          <span className="italic font-normal text-[#226949]">actually understand.</span>
        </h2>
        <p className="text-base sm:text-lg text-[#495057] mt-4 leading-relaxed font-interface">
          No vague affirmations. No black-box algorithms. SAAR converts what happened in your real day into trustworthy behavioral patterns, surfaces discoverable evidence, and tests actionable experiments.
        </p>
      </div>

      {/* Case Selector Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1.5 rounded-2xl bg-[#F5F2EB] border border-[rgba(15,17,21,0.06)] w-fit">
        {CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCaseId(c.id);
              setShowEvidence(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedCaseId === c.id
                ? 'bg-[#FFFFFF] text-[#0F1115] shadow-sm font-semibold'
                : 'text-[#495057] hover:text-[#0F1115]'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* The 4-Stage Human Transformation Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCase.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* 1. What Happened */}
          <div className="rounded-3xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.08)] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
                  Step 01 • What Happened
                </span>
                <span className="text-xs font-medium text-[#B45309] bg-[rgba(180,83,9,0.08)] px-2.5 py-0.5 rounded-full">
                  {activeCase.lifeArea}
                </span>
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#0F1115] mb-4">
                The Raw Reality
              </h3>

              <div className="space-y-3 text-sm text-[#495057]">
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.04)]">
                  <div className="text-xs text-[#868E96] font-medium">Planned Intent</div>
                  <div className="text-[#0F1115] font-medium mt-0.5">{activeCase.rawReality.planned}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.04)]">
                  <div className="text-xs text-[#868E96] font-medium">Actual Execution</div>
                  <div className="text-[#0F1115] font-medium mt-0.5">{activeCase.rawReality.actual}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.04)]">
                  <div className="text-xs text-[#9B2C2C] font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> Friction Logged
                  </div>
                  <div className="text-[#495057] mt-0.5">{activeCase.rawReality.friction}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(15,17,21,0.06)] text-xs text-[#868E96]">
              Extracted from task completions, schedule stamps, and check-ins.
            </div>
          </div>

          {/* 2. What SAAR Noticed */}
          <div className="rounded-3xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.08)] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
                  Step 02 • What SAAR Noticed
                </span>
                <span className="text-xs font-medium text-[#226949] bg-[rgba(34,105,73,0.08)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={12} /> Pattern Synthesized
                </span>
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#0F1115] mb-4">
                The Underlying Pattern
              </h3>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.06)]">
                <p className="text-base text-[#0F1115] leading-relaxed italic font-editorial font-medium">
                  &ldquo;{activeCase.patternDetected}&rdquo;
                </p>
              </div>

              {/* Discoverable Evidence Toggle */}
              <div className="mt-4">
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#226949] hover:underline"
                >
                  <Eye size={14} />
                  <span>{showEvidence ? 'Hide Underlying Evidence' : 'Inspect Supporting Evidence (3 data points)'}</span>
                </button>

                {showEvidence && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {activeCase.evidencePoints.map((pt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.06)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#0F1115]">{pt.label}</div>
                          <div className="text-[#868E96]">{pt.detail}</div>
                        </div>
                        <span className="font-bold tabular-nums text-[#226949]">{pt.metric}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(15,17,21,0.06)] text-xs text-[#868E96]">
              Evidence is always discoverable. SAAR never claims insights without supporting data.
            </div>
          </div>

          {/* 3. The Calibrated Experiment (Bottom Wide Card) */}
          <div className="md:col-span-2 rounded-3xl bg-[#0F1115] text-[#FAF8F5] p-6 sm:p-8 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
                Step 03 • Actionable Experiment
              </span>
              <span className="text-xs font-semibold text-[#226949] bg-[rgba(34,105,73,0.2)] px-3 py-1 rounded-full">
                Safe to test for 7 days
              </span>
            </div>

            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#FAF8F5] mb-2">
              {activeCase.proposedExperiment.headline}
            </h3>
            <p className="text-sm sm:text-base text-[#C5CCD3] leading-relaxed max-w-3xl mb-6">
              {activeCase.proposedExperiment.action}
            </p>

            <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-[#226949] flex-shrink-0" />
                <span className="text-sm font-medium text-[#FAF8F5]">
                  <strong>Projected Result:</strong> {activeCase.proposedExperiment.expectedOutcome}
                </span>
              </div>

              <span className="text-xs text-[#868E96]">
                Zero forced willpower • Structural adaptation
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
