'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles, ArrowRight, CornerDownRight } from 'lucide-react';
import { CompanionPulse } from '../domain/CompanionPulse';

interface CompanionPrompt {
  id: string;
  label: string;
  response: string;
  evidence: { label: string; value: string; context: string }[];
  actionProposal?: {
    title: string;
    description: string;
    impact: string;
  };
}

const COMPANION_PROMPTS: CompanionPrompt[] = [
  {
    id: 'p1',
    label: 'Why did my consistency drop this week?',
    response:
      'I reviewed your last 14 days of execution logs. On Tuesday and Thursday, your craft work extended past 8:30 PM, leaving less than 45 minutes before sleep. When your evening shutdown buffer collapses, morning friction spikes by 3x.',
    evidence: [
      { label: 'Evening Shutdown Buffer', value: '32 min avg', context: 'Normal threshold is >75 min' },
      { label: 'Morning Onset Friction', value: '+42% delay', context: 'Time to lace up running shoes delayed' },
      { label: 'Consecutive Sprint Days', value: '3 days', context: 'Cognitive strain outpaced physical recovery' },
    ],
    actionProposal: {
      title: 'Reschedule Thursday evening review to 10:00 AM Friday',
      description: 'Protects an 80-minute wind-down runway without losing sprint deliverables.',
      impact: '+28% probability of uninterrupted morning workout.',
    },
  },
  {
    id: 'p2',
    label: 'Am I over-allocating time to craft?',
    response:
      'Yes. Your current weekly plan allocates 48 hours to engineering and craft, leaving only 9 hours for physical health and 3 hours for deep relationships. This creates an unacknowledged trade-off against your stated Future Self values.',
    evidence: [
      { label: 'Craft Allocation', value: '68% of capacity', context: 'Stated goal was 55%' },
      { label: 'Relationship Allocation', value: '4.2% of capacity', context: 'Stated goal was 15%' },
      { label: 'Weekend Bleed', value: '3.5h logged', context: 'Work creep into personal recovery days' },
    ],
    actionProposal: {
      title: 'Cap weekly deep work sprints at 36 hours',
      description: 'Automatically reallocate surplus hours to unstructured family & recovery time.',
      impact: 'Restores sustainable life equilibrium without diminishing craft quality.',
    },
  },
  {
    id: 'p3',
    label: 'What is one gentle adjustment for tomorrow?',
    response:
      'Move your demanding 90-minute architecture sprint from 03:00 PM to 09:30 AM. Your circadian telemetry shows peak cognitive clarity occurs 2 hours after your morning sunlight walk.',
    evidence: [
      { label: 'Peak Cognitive Window', value: '09:30 - 11:30 AM', context: 'Fastest synthesis, zero context switches' },
      { label: 'Afternoon Focus Decay', value: '-35% speed', context: 'Measured across recent architecture PRs' },
      { label: 'Sunlight Circadian Signal', value: 'Logged at 07:45 AM', context: 'Anchors cortisol & focus rhythm' },
    ],
    actionProposal: {
      title: 'Swap morning email triage with Architecture Sprint',
      description: 'Tackle the hardest problem while your prefrontal cortex is completely fresh.',
      impact: 'Completes core deliverable before midday lunch.',
    },
  },
];

export function CompanionSection() {
  const [activePromptId, setActivePromptId] = useState('p1');
  const [showEvidence, setShowEvidence] = useState(false);
  const [actionApplied, setActionApplied] = useState(false);

  const activePrompt = COMPANION_PROMPTS.find((p) => p.id === activePromptId) || COMPANION_PROMPTS[0];

  const handleSelectPrompt = (id: string) => {
    setActivePromptId(id);
    setShowEvidence(false);
    setActionApplied(false);
  };

  return (
    <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="max-w-2xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#226949] bg-[rgba(34,105,73,0.08)] mb-3">
          06 • Grounded Companion
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#0F1115] tracking-tight leading-tight">
          A calm companion, <br />
          <span className="italic font-normal text-[#226949]">grounded in your actual life.</span>
        </h2>
        <p className="text-base sm:text-lg text-[#495057] mt-4 leading-relaxed font-interface">
          Not a generic chatbot that hallucinates advice. The SAAR Companion observes your real behavioral patterns, answers with discoverable evidence, and proposes explicit actions that require your deliberate confirmation.
        </p>
      </div>

      {/* Main Companion Workspace Container */}
      <div className="rounded-3xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.08)] p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ambient Presence & Prompt Questions */}
        <div className="lg:col-span-5 space-y-6">
          {/* SAAR Pulse Ambient Presence Card */}
          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.06)] flex items-center gap-4">
            <CompanionPulse state="idle" size={40} />
            <div>
              <div className="font-editorial text-lg font-bold text-[#0F1115]">
                SAAR Pulse Active
              </div>
              <div className="text-xs text-[#868E96] mt-0.5">
                Listening to 14-day behavioral signals & schedule capacity.
              </div>
            </div>
          </div>

          {/* Contextual Inquiries */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96] mb-3 block">
              Sample Context Inquiries
            </span>
            <div className="space-y-2.5">
              {COMPANION_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt.id)}
                  className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-center justify-between ${
                    activePromptId === prompt.id
                      ? 'bg-[#0F1115] text-[#FAF8F5] border-[#0F1115] shadow-sm'
                      : 'bg-[#FAF8F5] text-[#495057] border-[rgba(15,17,21,0.06)] hover:bg-[#F5F2EB]'
                  }`}
                >
                  <span>{prompt.label}</span>
                  <CornerDownRight size={14} className={activePromptId === prompt.id ? 'text-[#226949]' : 'text-[#868E96]'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Grounded Dialogue & Discoverable Evidence */}
        <div className="lg:col-span-7 rounded-2xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.06)] p-6 sm:p-7 space-y-6">
          {/* Active Question */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#868E96]">
            <span>Inquiry</span>
            <span>•</span>
            <span className="text-[#0F1115] font-semibold">{activePrompt.label}</span>
          </div>

          {/* Response Stream */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePrompt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.06)]">
                <p className="text-base text-[#0F1115] leading-relaxed font-editorial font-medium">
                  &ldquo;{activePrompt.response}&rdquo;
                </p>
              </div>

              {/* Discoverable Evidence Drawer */}
              <div className="border border-[rgba(15,17,21,0.06)] rounded-xl bg-[#FFFFFF] overflow-hidden">
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="w-full px-4 py-3 text-xs font-semibold text-[#495057] hover:text-[#0F1115] flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#226949]" />
                    Discoverable Evidence Behind This Claim ({activePrompt.evidence.length} verified metrics)
                  </span>
                  {showEvidence ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showEvidence && (
                  <div className="px-4 pb-4 space-y-2 border-t border-[rgba(15,17,21,0.06)] pt-3">
                    {activePrompt.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-[#FAF8F5] text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-[#0F1115]">{ev.label}</div>
                          <div className="text-[11px] text-[#868E96]">{ev.context}</div>
                        </div>
                        <span className="font-bold tabular-nums text-[#226949]">{ev.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Explicit Action Proposal Card */}
              {activePrompt.actionProposal && (
                <div className="p-5 rounded-2xl bg-[#0F1115] text-[#FAF8F5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#226949]">
                      Proposed Schedule Adjustment
                    </span>
                    <span className="text-[11px] text-[#868E96]">Requires Confirmation</span>
                  </div>

                  <h4 className="font-editorial text-lg font-bold text-[#FAF8F5]">
                    {activePrompt.actionProposal.title}
                  </h4>
                  <p className="text-xs text-[#C5CCD3] leading-relaxed">
                    {activePrompt.actionProposal.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.08)]">
                    <span className="text-xs text-[#226949] font-medium">
                      {activePrompt.actionProposal.impact}
                    </span>

                    {actionApplied ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#226949] bg-[rgba(34,105,73,0.2)] px-3 py-1.5 rounded-xl">
                        <CheckCircle2 size={14} /> Applied to Schedule
                      </span>
                    ) : (
                      <button
                        onClick={() => setActionApplied(true)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#226949] hover:bg-[#1B543A] text-white transition-colors"
                      >
                        Confirm & Apply to Schedule
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
