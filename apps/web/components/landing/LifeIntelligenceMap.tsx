'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeAreaIcon, type LifeAreaType } from '../icons/LifeAreaIcons';
import { CheckCircle2, ArrowRight, Zap, Target } from 'lucide-react';

interface LifeAreaDetail {
  id: LifeAreaType;
  name: string;
  tagline: string;
  score: number;
  trend: string;
  color: string;
  bgLight: string;
  connectedTo: LifeAreaType[];
  goals: { title: string; target: string; progress: number }[];
  recentPattern: string;
  nextDeliberateAction: { title: string; time: string; duration: string };
  equilibriumNote: string;
}

const LIFE_AREAS: LifeAreaDetail[] = [
  {
    id: 'health',
    name: 'Health & Vitality',
    tagline: 'Physical resilience, aerobic baseline, and circadian recovery',
    score: 84,
    trend: '+8% this month',
    color: '#226949',
    bgLight: 'rgba(34, 105, 73, 0.08)',
    connectedTo: ['mind', 'career'],
    goals: [
      { title: 'Sub-60min 10K Endurance Base', target: '3 sessions / wk', progress: 85 },
      { title: 'Circadian Sleep Rhythm (>7.5h)', target: '5 nights / wk', progress: 78 },
    ],
    recentPattern:
      '3 morning Zone 2 workouts completed. Sleep consistency remained high except on Thursday night after a late screen session.',
    nextDeliberateAction: {
      title: 'Zone 2 aerobic recovery run',
      time: '07:30 AM Tomorrow',
      duration: '40m',
    },
    equilibriumNote: 'Reinforces Mind and Career capacity by supplying sustained afternoon cognitive endurance.',
  },
  {
    id: 'mind',
    name: 'Mind & Clarity',
    tagline: 'Deep cognitive focus, emotional poise, and mental space',
    score: 79,
    trend: '+4% this month',
    color: '#4D5091',
    bgLight: 'rgba(77, 80, 145, 0.08)',
    connectedTo: ['health', 'purpose'],
    goals: [
      { title: 'Daily Unhurried Evening Reflection', target: 'Daily 15m', progress: 80 },
      { title: 'Deep Architecture Focus Blocks', target: '4 sessions / wk', progress: 75 },
    ],
    recentPattern:
      'Deep work sprints had zero distractions during morning hours. Mental fatigue elevated when shutdown buffer was skipped.',
    nextDeliberateAction: {
      title: 'Mindful evening review & reading',
      time: '09:00 PM Tonight',
      duration: '20m',
    },
    equilibriumNote: 'Prevents burnout by decoupling personal worth from daily task throughput.',
  },
  {
    id: 'career',
    name: 'Career & Craft',
    tagline: 'Deliberate building, architectural mastery, and deep contribution',
    score: 88,
    trend: 'Stable high velocity',
    color: '#B45309',
    bgLight: 'rgba(180, 83, 9, 0.08)',
    connectedTo: ['health', 'finance'],
    goals: [
      { title: 'Enterprise Engine Architecture Delivery', target: 'Q4 Milestone', progress: 92 },
      { title: 'Mentorship & Systems Writing', target: '2 essays / mo', progress: 65 },
    ],
    recentPattern:
      'High execution across core architectural deliverables. Risk identified: creeping into evening recovery time.',
    nextDeliberateAction: {
      title: 'Focused domain interface review',
      time: '10:00 AM Tomorrow',
      duration: '60m',
    },
    equilibriumNote: 'Generates leverage for Purpose and Finance while borrowing vitality from Health.',
  },
  {
    id: 'relationships',
    name: 'Relationships & Connection',
    tagline: 'Unhurried presence, deep listening, and enduring bonds',
    score: 72,
    trend: 'Needs intentional space',
    color: '#9B2C2C',
    bgLight: 'rgba(155, 44, 44, 0.08)',
    connectedTo: ['mind', 'purpose'],
    goals: [
      { title: 'Weekly Device-Free Long Dinner', target: 'Every Sunday', progress: 70 },
      { title: 'Proactive Call to Family & Friends', target: '2x / wk', progress: 60 },
    ],
    recentPattern:
      'Genuine depth achieved during weekend conversations. Weekday interactions felt hurried due to fragmented context switching.',
    nextDeliberateAction: {
      title: 'Unhurried walk & call with close friend',
      time: '05:30 PM Friday',
      duration: '35m',
    },
    equilibriumNote: 'Anchors emotional health and grounds purpose during demanding professional sprints.',
  },
  {
    id: 'finance',
    name: 'Finance & Stewardship',
    tagline: 'Calibrated reserves, long-term sovereignty, and conscious allocation',
    score: 81,
    trend: '+12% this quarter',
    color: '#0F766E',
    bgLight: 'rgba(15, 118, 110, 0.08)',
    connectedTo: ['career', 'purpose'],
    goals: [
      { title: 'Automatic Savings & Index Allocation', target: 'Monthly Target', progress: 100 },
      { title: 'Zero Impulsive Discretionary Spending', target: '<5% variance', progress: 85 },
    ],
    recentPattern:
      'Automated systems executed cleanly on payday. Low cognitive drag; resource allocation aligned with long-term goals.',
    nextDeliberateAction: {
      title: 'Monthly capital allocation audit',
      time: 'Saturday 11:00 AM',
      duration: '20m',
    },
    equilibriumNote: 'Creates freedom and removes anxiety so energy can flow to Craft and Relationships.',
  },
  {
    id: 'purpose',
    name: 'Purpose & Philosophy',
    tagline: 'Internal compass, ethical alignment, and intentional living',
    score: 86,
    trend: 'Clear alignment',
    color: '#8C6D3B',
    bgLight: 'rgba(140, 109, 59, 0.08)',
    connectedTo: ['mind', 'relationships'],
    goals: [
      { title: 'Monthly Living Philosophy Synthesis', target: '1 entry / mo', progress: 85 },
      { title: 'Direct Community Contribution', target: 'Bi-weekly', progress: 75 },
    ],
    recentPattern:
      'Clear sense of direction guiding weekly trade-offs. Regular check-ins prevent accidental drift.',
    nextDeliberateAction: {
      title: 'Quarterly identity reflection prompt',
      time: 'Sunday Evening',
      duration: '30m',
    },
    equilibriumNote: 'The overarching north star that integrates every other life area into a coherent life.',
  },
];

export function LifeIntelligenceMap() {
  const [selectedAreaId, setSelectedAreaId] = useState<LifeAreaType>('health');
  const selectedArea = LIFE_AREAS.find((a) => a.id === selectedAreaId) || LIFE_AREAS[0];

  return (
    <section id="life-intelligence" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Section Header */}
      <div className="max-w-2xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#226949] bg-[rgba(34,105,73,0.08)] mb-3">
          02 • What Is Happening In My Life
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#0F1115] tracking-tight leading-tight">
          Life is an ecosystem, <br />
          <span className="italic font-normal text-[#226949]">not an isolated checklist.</span>
        </h2>
        <p className="text-base sm:text-lg text-[#495057] mt-4 leading-relaxed font-interface">
          Select any life area to see how SAAR maps your actual behavioral reality, detects reciprocal dependencies, and surfaces next deliberate actions.
        </p>
      </div>

      {/* Interactive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Orbital Nodes Grid & Central Self */}
        <div className="lg:col-span-5 rounded-3xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.08)] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[rgba(15,17,21,0.06)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
              Life Areas Ecosystem
            </span>
            <span className="text-xs text-[#226949] font-medium">Click to inspect</span>
          </div>

          {/* Area Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LIFE_AREAS.map((area) => {
              const isSelected = area.id === selectedAreaId;
              const isConnected = selectedArea.connectedTo.includes(area.id);

              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`p-3.5 rounded-2xl text-left transition-all border flex items-center gap-3 relative ${
                    isSelected
                      ? 'bg-[#FAF8F5] border-[#0F1115] shadow-sm'
                      : isConnected
                      ? 'bg-[rgba(245,242,235,0.6)] border-[rgba(15,17,21,0.12)]'
                      : 'bg-[#FFFFFF] border-[rgba(15,17,21,0.06)] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: isSelected ? area.color : area.bgLight,
                      color: isSelected ? '#FFFFFF' : area.color,
                    }}
                  >
                    <LifeAreaIcon area={area.id} size={18} strokeWidth={2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0F1115] truncate">
                        {area.name.split(' ')[0]}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-[#495057]">
                        {area.score}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[#868E96] truncate mt-0.5">
                      {isSelected ? 'Active Focus' : isConnected ? 'Connected Area' : area.trend}
                    </div>
                  </div>

                  {isConnected && !isSelected && (
                    <span
                      className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selectedArea.color }}
                      title="Direct reciprocal relationship"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Ecosystem Balance Summary */}
          <div className="mt-5 p-4 rounded-2xl bg-[#F5F2EB] border border-[rgba(15,17,21,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#226949] animate-pulse" />
              <span className="text-xs font-medium text-[#495057]">Overall Equilibrium Index</span>
            </div>
            <span className="text-sm font-editorial font-bold text-[#0F1115] tabular-nums">
              81.7% • Resilient
            </span>
          </div>
        </div>

        {/* Right: Responsive Detail Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedArea.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.08)] p-6 sm:p-8 shadow-sm"
            >
              {/* Top Banner */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[rgba(15,17,21,0.06)]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedArea.color }}
                  >
                    <LifeAreaIcon area={selectedArea.id} size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-editorial text-2xl font-bold text-[#0F1115]">
                      {selectedArea.name}
                    </h3>
                    <p className="text-xs text-[#868E96] mt-0.5">{selectedArea.tagline}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-editorial font-bold text-[#0F1115] tabular-nums">
                    {selectedArea.score}%
                  </span>
                  <div className="text-xs text-[#226949] font-medium">{selectedArea.trend}</div>
                </div>
              </div>

              {/* 1. Goals & Active Destinations */}
              <div className="py-6 border-b border-[rgba(15,17,21,0.06)]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#868E96] mb-3">
                  <Target size={14} className="text-[#0F1115]" />
                  Active Destination Goals
                </div>
                <div className="space-y-3">
                  {selectedArea.goals.map((goal, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.06)] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#0F1115]">{goal.title}</div>
                        <div className="text-xs text-[#868E96] mt-0.5">{goal.target}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold tabular-nums text-[#226949]">
                          {goal.progress}%
                        </span>
                        <div className="w-16 h-1 bg-[#F5F2EB] rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${goal.progress}%`, backgroundColor: selectedArea.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Recent Behavioral Pattern */}
              <div className="py-6 border-b border-[rgba(15,17,21,0.06)]">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#868E96] mb-2">
                  Observed Pattern (Last 14 Days)
                </div>
                <p className="text-sm text-[#495057] leading-relaxed">
                  &ldquo;{selectedArea.recentPattern}&rdquo;
                </p>
              </div>

              {/* 3. Next Meaningful Deliberate Action */}
              <div className="pt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#868E96] mb-3">
                  Next Calibrated Action
                </div>
                <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.08)] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[rgba(34,105,73,0.1)] text-[#226949]">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0F1115]">
                        {selectedArea.nextDeliberateAction.title}
                      </div>
                      <div className="text-xs text-[#868E96]">
                        {selectedArea.nextDeliberateAction.time} • {selectedArea.nextDeliberateAction.duration}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[#226949] bg-[rgba(34,105,73,0.08)] px-3 py-1 rounded-full">
                    High Leverage
                  </span>
                </div>

                {/* Reciprocal Impact Note */}
                <div className="mt-4 p-3 rounded-xl bg-[#F5F2EB] border border-[rgba(15,17,21,0.04)] text-xs text-[#495057] flex items-center gap-2">
                  <Zap size={14} className="text-[#B45309] flex-shrink-0" />
                  <span>
                    <strong>Ecosystem Impact:</strong> {selectedArea.equilibriumNote}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
