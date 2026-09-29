'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeAreaIcon } from '../icons/LifeAreaIcons';

interface CalibrationStage {
  id: number;
  label: string;
  alignment: number;
  gapPercentage: number;
  todaySummary: {
    status: string;
    routine: string;
    evening: string;
    energy: string;
  };
  futureImpact: {
    state: string;
    trajectory: string;
    evidence: string;
  };
}

const STAGES: CalibrationStage[] = [
  {
    id: 0,
    label: 'Uncalibrated Friction',
    alignment: 48,
    gapPercentage: 52,
    todaySummary: {
      status: 'Overloaded by 2h 15m',
      routine: '3 of 5 habits rushed or skipped',
      evening: 'Late message responses until 11:30 PM',
      energy: 'Cognitive strain outpaces recovery',
    },
    futureImpact: {
      state: 'Divergent Trajectory',
      trajectory: 'Daily reality drifts away from desired calm identity.',
      evidence: 'High burnout risk on consecutive workdays.',
    },
  },
  {
    id: 1,
    label: 'Calibrated Daily Rhythm',
    alignment: 84,
    gapPercentage: 16,
    todaySummary: {
      status: 'Sustainable 7h 20m load',
      routine: 'Morning zone 2 cardio & deep work locked in',
      evening: '45-minute unhurried shutdown buffer',
      energy: 'Restorative baseline preserved',
    },
    futureImpact: {
      state: 'Convergent Alignment',
      trajectory: 'Daily actions actively substantiate the Future Self identity.',
      evidence: '14-day consistency is stable without willpower depletion.',
    },
  },
  {
    id: 2,
    label: 'Compounded Becoming',
    alignment: 96,
    gapPercentage: 4,
    todaySummary: {
      status: 'Automatic behavioral rhythm',
      routine: 'Deliberate choices require near-zero friction',
      evening: 'Peaceful mental closure & deep sleep',
      energy: 'Consistent surplus vitality',
    },
    futureImpact: {
      state: 'Identity Embodied',
      trajectory: 'You have become the person you once envisioned.',
      evidence: 'New challenges effortlessly integrated into your rhythm.',
    },
  },
];

export function BecomingField() {
  const [activeStage, setActiveStage] = useState(1);
  const current = STAGES[activeStage] || STAGES[1];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.08)] shadow-[0_8px_30px_rgba(15,17,21,0.04)] p-6 md:p-10 relative overflow-hidden">
      {/* Background Ambience — Quiet Ivory/Sage Luminance */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none opacity-40 blur-3xl rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34,105,73,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Header & Interactive Scrub Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-[rgba(15,17,21,0.06)] relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#226949] bg-[rgba(34,105,73,0.08)] mb-2">
            Signature Interaction • The Becoming Field
          </div>
          <h2 className="font-editorial text-2xl md:text-3xl font-semibold text-[#0F1115] tracking-tight">
            How small daily calibrations transform who you become
          </h2>
          <p className="text-sm text-[#495057] mt-1">
            Slide through the three states of behavioral alignment to inspect the consequence on your future trajectory.
          </p>
        </div>

        {/* Step Selector Buttons */}
        <div className="flex items-center bg-[#F5F2EB] p-1.5 rounded-2xl border border-[rgba(15,17,21,0.06)] w-full md:w-auto">
          {STAGES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStage(idx)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                activeStage === idx
                  ? 'bg-[#FFFFFF] text-[#0F1115] shadow-sm font-semibold'
                  : 'text-[#868E96] hover:text-[#0F1115]'
              }`}
            >
              {s.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Field Representation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8 relative z-10">
        {/* Left Side: TODAY (Current Behavior) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.06)] p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider text-[#868E96] uppercase">
                Where You Stand Today
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" title="Active Daily Reality" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#0F1115] mb-4">
              Daily Reality & Load
            </h3>

            <AnimatePresence mode="wait">
              <motion.div
                key={`today-${current.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#B45309]">
                    <LifeAreaIcon area="career" size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-[#868E96]">Schedule Load</div>
                    <div className="text-sm font-medium text-[#0F1115]">{current.todaySummary.status}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#226949]">
                    <LifeAreaIcon area="health" size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-[#868E96]">Routine Execution</div>
                    <div className="text-sm font-medium text-[#0F1115]">{current.todaySummary.routine}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#4D5091]">
                    <LifeAreaIcon area="mind" size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-[#868E96]">Evening Shutdown</div>
                    <div className="text-sm font-medium text-[#0F1115]">{current.todaySummary.evening}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pt-4 mt-4 border-t border-[rgba(15,17,21,0.06)] text-xs text-[#868E96]">
            Measured via real timestamped execution logs.
          </div>
        </div>

        {/* Center: The Becoming Field Vector / Connection */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-4 px-2 text-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Outer Subtle Ripple */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border border-[rgba(34,105,73,0.2)]"
            />
            {/* Middle Circle */}
            <div className="absolute inset-4 rounded-full border border-[rgba(15,17,21,0.08)] bg-[#F5F2EB]" />

            {/* Inner Indicator */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-3xl font-editorial font-bold text-[#226949] tabular-nums">
                {current.alignment}%
              </span>
              <span className="text-[11px] font-medium tracking-tight text-[#495057] uppercase mt-0.5">
                Alignment Vector
              </span>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#495057]">
              Remaining Behavioral Gap:{' '}
              <span className="text-[#0F1115] font-bold tabular-nums">{current.gapPercentage}%</span>
            </span>
            <div className="w-48 h-1.5 bg-[#E8E4DC] rounded-full mx-auto mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-[#226949] rounded-full"
                animate={{ width: `${current.alignment}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: FUTURE SELF (The Person You're Becoming) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0F1115] text-[#FAF8F5] p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider text-[#868E96] uppercase">
                The Destination
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#226949]" title="Future Self Target" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#FAF8F5] mb-4">
              Who You Are Becoming
            </h3>

            <AnimatePresence mode="wait">
              <motion.div
                key={`future-${current.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div>
                  <div className="text-xs text-[#868E96]">Projected State</div>
                  <div className="text-sm font-medium text-[#FAF8F5] mt-0.5">{current.futureImpact.state}</div>
                </div>

                <div>
                  <div className="text-xs text-[#868E96]">Trajectory Assessment</div>
                  <div className="text-sm text-[#C5CCD3] mt-0.5 leading-snug">{current.futureImpact.trajectory}</div>
                </div>

                <div>
                  <div className="text-xs text-[#868E96]">Behavioral Evidence</div>
                  <div className="text-sm text-[#C5CCD3] mt-0.5 leading-snug">{current.futureImpact.evidence}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.1)] text-xs text-[#868E96]">
            Identity defined by choices, not arbitrary milestones.
          </div>
        </div>
      </div>
    </div>
  );
}
