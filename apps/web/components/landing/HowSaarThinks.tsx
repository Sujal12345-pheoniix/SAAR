'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { FadeIn } from '@/components/motion/FadeIn';
import { CheckCircle2, Sparkles, Activity, Compass, Target, Brain, Lightbulb, Zap } from 'lucide-react';

const PIPELINE_NODES = [
  {
    id: 0,
    step: '01',
    label: 'Daily Activity Capture',
    sub: 'Habits · Tasks · Micro-behaviors',
    color: '#06B6D4',
    icon: Activity,
    insight: '"You completed 4 out of 5 habits today. Morning focus sessions had a 94% completion rate."',
    metric: '94% completion rate',
    confidence: 94,
  },
  {
    id: 1,
    step: '02',
    label: 'Life Area Mapping',
    sub: 'Health · Career · Mind · Relationships',
    color: '#6366F1',
    icon: Compass,
    insight: '"Health & Fitness is your highest engagement area this week at 82%, up 14% from last week."',
    metric: '82% engagement',
    confidence: 89,
  },
  {
    id: 2,
    step: '03',
    label: 'Goal & Identity Alignment',
    sub: 'Future Self · Core Values · Priorities',
    color: '#8B5CF6',
    icon: Target,
    insight: '"Your recorded actions are 78% aligned with your desired Future Self identity vector."',
    metric: '78% alignment index',
    confidence: 91,
  },
  {
    id: 3,
    step: '04',
    label: 'Pattern & Correlation Engine',
    sub: 'Trends · Energy Cycles · Blockers',
    color: '#F59E0B',
    icon: Brain,
    insight: '"Deep focus scores drop 38% on days following less than 7 hours of restorative sleep."',
    metric: 'Strong sleep-focus correlation',
    confidence: 96,
  },
  {
    id: 4,
    step: '05',
    label: 'Synthesis & Actionable Insight',
    sub: 'Root causes · Growth leverage points',
    color: '#22C55E',
    icon: Lightbulb,
    insight: '"Prioritizing afternoon recovery rituals leads to 2.1x higher consistency across the following week."',
    metric: '2.1x consistency multiplier',
    confidence: 92,
  },
  {
    id: 5,
    step: '06',
    label: 'Contextual Action Guidance',
    sub: 'Adaptive priorities · Tomorrow\'s blueprint',
    color: '#6366F1',
    icon: Zap,
    insight: '"Front-load tomorrow\'s primary learning block before 10:30 AM for peak cognitive alignment."',
    metric: 'Peak focus window: 8-10:30 AM',
    confidence: 95,
  },
];

export function HowSaarThinks() {
  const [activeNode, setActiveNode] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });

  const activeData = PIPELINE_NODES[activeNode] ?? PIPELINE_NODES[0];
  const ActiveIcon = activeData.icon;

  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 px-4 sm:px-6 w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      <div className="w-full max-w-6xl mx-auto">
        {/* Section Header */}
        <FadeIn className="text-center mb-16 md:mb-20 w-full flex flex-col items-center">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            style={{
              background: 'rgba(99,102,241,0.08)',
              color: 'var(--accent)',
              border: '1px solid rgba(99,102,241,0.18)',
              letterSpacing: '0.08em',
            }}
          >
            <Sparkles size={12} className="text-indigo-500" />
            Intelligence Architecture
          </div>

          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 text-center"
            style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}
          >
            How SAAR thinks
          </h2>
          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto text-center"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}
          >
            Every signal you log flows through a multi-tier neural pipeline that transforms raw everyday behavior into crystal clear actionable clarity.
          </p>
        </FadeIn>

        {/* 2-Column Responsive Layout */}
        <div
          ref={containerRef}
          className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full"
        >
          {/* Left Column: Interactive Pipeline Steps */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-2 px-2"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}
            >
              Pipeline Stages · Click or Hover to Explore
            </p>

            {PIPELINE_NODES.map((node, i) => {
              const IconComp = node.icon;
              const isActive = activeNode === i;

              return (
                <motion.div
                  key={node.id}
                  onClick={() => setActiveNode(i)}
                  onMouseEnter={() => setActiveNode(i)}
                  className="group relative p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300"
                  style={{
                    background: isActive ? 'var(--surface)' : 'var(--bg)',
                    border: `1.5px solid ${isActive ? node.color : 'var(--border)'}`,
                    boxShadow: isActive
                      ? `0 10px 30px -8px ${node.color}25, 0 2px 10px rgba(11,16,32,0.04)`
                      : 'none',
                    transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon & Step Number */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        background: isActive ? `${node.color}18` : 'rgba(255,255,255,0.8)',
                        border: `1px solid ${isActive ? `${node.color}40` : 'var(--border)'}`,
                        color: node.color,
                        boxShadow: isActive ? `0 0 16px ${node.color}30` : 'none',
                      }}
                    >
                      <IconComp size={22} />
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[11px] font-mono font-bold tracking-wider"
                          style={{ color: node.color }}
                        >
                          STAGE {node.step}
                        </span>
                        {isActive && (
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full animate-ping"
                            style={{ background: node.color }}
                          />
                        )}
                      </div>
                      <h3
                        className="font-bold text-base sm:text-lg leading-tight truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {node.label}
                      </h3>
                      <p
                        className="text-xs sm:text-sm mt-0.5 truncate"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {node.sub}
                      </p>
                    </div>

                    {/* Active Arrow indicator */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
                      style={{
                        background: isActive ? `${node.color}15` : 'transparent',
                        color: isActive ? node.color : 'var(--text-tertiary)',
                        opacity: isActive ? 1 : 0.4,
                      }}
                    >
                      <span className="text-sm font-bold">→</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Bounded Live Intelligence Console */}
          <div className="lg:col-span-6 lg:sticky lg:top-28 self-start w-full">
            <motion.div
              className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(155deg, #0B1020 0%, #151A30 60%, #1E1B4B 100%)',
                boxShadow: '0 25px 60px -12px rgba(11,16,32,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {/* Ambient Glow */}
              <div
                className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${activeData.color}35 0%, transparent 70%)`,
                  filter: 'blur(40px)',
                  transition: 'background 0.5s ease',
                }}
              />

              {/* Console Top Bar */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ background: '#22C55E', boxShadow: '0 0 10px #22C55E' }}
                  />
                  <span
                    className="text-xs font-mono font-bold tracking-widest uppercase"
                    style={{ color: '#E2E8F0', letterSpacing: '0.12em' }}
                  >
                    LIVE INTELLIGENCE CONSOLE
                  </span>
                </div>

                <div
                  className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold"
                  style={{
                    background: `${activeData.color}25`,
                    color: '#FFFFFF',
                    border: `1px solid ${activeData.color}50`,
                  }}
                >
                  STAGE {activeData.step} ACTIVE
                </div>
              </div>

              {/* Dynamic Layer Content */}
              <motion.div
                key={activeNode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 flex flex-col gap-5"
              >
                {/* Active Layer Header Pill */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{
                      background: activeData.color,
                      boxShadow: `0 0 20px ${activeData.color}60`,
                    }}
                  >
                    <ActiveIcon size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      Synthesized Insight
                    </span>
                    <h4 className="text-lg font-bold text-white leading-tight">
                      {activeData.label}
                    </h4>
                  </div>
                </div>

                {/* Insight Quote Card */}
                <div
                  className="p-5 rounded-2xl border"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <p
                    className="text-base sm:text-lg font-medium leading-relaxed"
                    style={{ color: '#F8FAFC' }}
                  >
                    {activeData.insight}
                  </p>
                </div>

                {/* Metric & Confidence Meter */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold" style={{ color: '#CBD5E1' }}>
                      Signal Confidence
                    </span>
                    <span className="font-bold text-white">
                      {activeData.confidence}% verified
                    </span>
                  </div>

                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${activeData.color}, #67E8F9)`,
                        boxShadow: `0 0 12px ${activeData.color}80`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${activeData.confidence}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span className="text-xs" style={{ color: '#94A3B8' }}>
                      Primary Metric: <strong className="text-white font-semibold">{activeData.metric}</strong>
                    </span>
                  </div>
                </div>

                {/* System Capabilities Checklist */}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                    Active Feedback Loops
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Real-time telemetry', active: true },
                      { label: 'Cross-area correlation', active: true },
                      { label: 'Personalized calibration', active: true },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-xl flex items-center gap-2"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />
                        <span className="text-[11px] font-medium truncate" style={{ color: '#E2E8F0' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
