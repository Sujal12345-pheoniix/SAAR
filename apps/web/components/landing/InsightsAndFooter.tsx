'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { FadeIn } from '@/components/motion/FadeIn';
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { SaarLogo } from '@/components/ui/SaarLogo';
import Link from 'next/link';

const RAW_SIGNALS = [
  { label: '7 workouts logged', sub: 'Strength & Zone 2 cardio', icon: '💪', color: '#22C55E', tag: '+2 vs target' },
  { label: '5.2h deep learning', sub: 'TypeScript & Architecture', icon: '📚', color: '#06B6D4', tag: 'Streak: 6 days' },
  { label: '6.8h avg sleep duration', sub: 'Sleep score: 79/100', icon: '😴', color: '#8B5CF6', tag: '-0.7h deficit' },
  { label: '4 habit friction points', sub: 'Evening routine slip', icon: '⚠️', color: '#F59E0B', tag: 'High friction' },
  { label: '82% overall task completion', sub: '37 of 45 tasks closed', icon: '✅', color: '#6366F1', tag: 'Top quartile' },
];

const INSIGHTS = [
  {
    observation: 'Your consistency drops 38% after high-workload days.',
    action: 'Schedule an automatic 20-minute restorative wind-down ritual whenever daily work hours exceed 8.5h.',
    confidence: 92,
    impact: 'High Impact',
    category: 'Energy & Recovery',
  },
  {
    observation: 'You perform best when sleep duration exceeds 7.5 hours.',
    action: 'Moving your morning workout 30 minutes earlier creates sustained alertness across the entire afternoon.',
    confidence: 88,
    impact: 'Cognitive Optimization',
    category: 'Circadian Rhythm',
  },
  {
    observation: 'Learning blocks and creative focus scores are deeply correlated for you.',
    action: 'Front-load your primary 45-minute learning block before 10:30 AM to maximize daily momentum.',
    confidence: 85,
    impact: 'Skill Acceleration',
    category: 'Habit Architecture',
  },
];

export function InsightsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [activeInsight, setActiveInsight] = useState(0);

  return (
    <section
      id="insights"
      className="relative py-24 md:py-32 px-4 sm:px-6 w-full flex flex-col items-center justify-center"
      style={{ background: 'var(--surface)' }}
    >
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
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
            Synthesis Engine
          </div>

          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 text-center"
            style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}
          >
            Raw data becomes<br />
            <span className="gradient-text">real clarity.</span>
          </h2>
          <p
            className="text-lg sm:text-xl max-w-lg mx-auto text-center"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}
          >
            SAAR transforms disparate daily inputs into precise, contextual intelligence you can immediately act upon.
          </p>
        </FadeIn>

        {/* 2 Columns: Signals & Insights */}
        <div
          ref={ref}
          className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full max-w-5xl mx-auto"
        >
          {/* Left Column: Raw Behavioral Signals */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}
              >
                Raw Signals · Logged This Week
              </p>
              <span className="text-xs font-semibold text-indigo-600">5 sources active</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {RAW_SIGNALS.map((sig, i) => (
                <motion.div
                  key={sig.label}
                  className="flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-200"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  whileHover={{ x: 4, borderColor: 'rgba(99,102,241,0.3)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${sig.color}15`, border: `1px solid ${sig.color}30` }}
                  >
                    {sig.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {sig.label}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {sig.sub}
                    </p>
                  </div>

                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(11,16,32,0.04)', color: 'var(--text-secondary)' }}
                  >
                    {sig.tag}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: AI-Generated Insights */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}
              >
                Synthesized Insights · Click to inspect
              </p>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Analysis
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {INSIGHTS.map((insight, i) => {
                const isActive = activeInsight === i;

                return (
                  <motion.div
                    key={i}
                    onClick={() => setActiveInsight(i)}
                    className="w-full text-left rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
                    style={{
                      background: isActive
                        ? 'linear-gradient(145deg, #0B1020 0%, #171C35 100%)'
                        : 'var(--bg)',
                      border: isActive
                        ? '1.5px solid rgba(99,102,241,0.5)'
                        : '1px solid var(--border)',
                      boxShadow: isActive
                        ? '0 12px 35px -8px rgba(99,102,241,0.25)'
                        : 'none',
                    }}
                    initial={{ opacity: 0, x: 16 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            background: isActive ? 'rgba(99,102,241,0.25)' : 'rgba(11,16,32,0.06)',
                            color: isActive ? '#C7D2FE' : 'var(--text-secondary)',
                          }}
                        >
                          {insight.category}
                        </span>

                        <span
                          className="text-xs font-semibold"
                          style={{ color: isActive ? '#34D399' : 'var(--accent)' }}
                        >
                          {insight.impact}
                        </span>
                      </div>

                      <h3
                        className="text-base sm:text-lg font-bold leading-snug"
                        style={{ color: isActive ? '#FFFFFF' : 'var(--text-primary)' }}
                      >
                        &ldquo;{insight.observation}&rdquo;
                      </h3>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3.5"
                        >
                          <div>
                            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-semibold block mb-1">
                              Prescribed Next Action:
                            </span>
                            <p className="text-sm font-medium leading-relaxed" style={{ color: '#E2E8F0' }}>
                              {insight.action}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span style={{ color: '#CBD5E1' }}>Algorithmic Confidence</span>
                              <strong className="text-white font-bold">{insight.confidence}% verified</strong>
                            </div>

                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #6366F1, #38BDF8)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${insight.confidence}%` }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- CTA Section ---- */
export function CtaSection() {
  return (
    <section
      className="relative py-24 md:py-32 px-4 sm:px-6 w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-4xl mx-auto">
        <FadeIn className="w-full flex flex-col items-center">
          <div
            className="w-full rounded-3xl p-8 sm:p-14 md:p-16 relative overflow-hidden"
            style={{
              background: 'linear-gradient(150deg, #0B1020 0%, #151A32 50%, #1E1B4B 100%)',
              boxShadow: '0 30px 80px -15px rgba(11,16,32,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            {/* Top Atmospheric Radial Glow */}
            <div
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                filter: 'blur(50px)',
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Badge with 100% visible, high-contrast text */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold tracking-widest uppercase mb-6 sm:mb-8"
                style={{
                  background: 'rgba(99,102,241,0.35)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(165,180,252,0.45)',
                  boxShadow: '0 0 16px rgba(99,102,241,0.3)',
                  letterSpacing: '0.1em',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                Begin your growth journey
              </div>

              {/* Headline */}
              <h2
                className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 text-center tracking-tight"
                style={{ letterSpacing: '-0.03em', lineHeight: 1.15, color: '#FFFFFF' }}
              >
                Understand yourself.<br />
                <span className="gradient-text">Build what comes next.</span>
              </h2>

              {/* Subheading */}
              <p
                className="text-base sm:text-xl mb-10 text-center max-w-xl mx-auto leading-relaxed"
                style={{ color: '#E2E8F0', lineHeight: 1.65 }}
              >
                SAAR is the personal intelligence layer between where you are today and the identity you are building tomorrow.
              </p>

              {/* CTA Action Button */}
              <div className="flex flex-wrap gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base !text-white shadow-xl transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      boxShadow: '0 8px 30px rgba(99,102,241,0.5)',
                      textDecoration: 'none',
                      color: '#FFFFFF',
                    }}
                  >
                    Start for free
                    <ArrowRight size={18} className="text-white" />
                  </Link>
                </motion.div>
              </div>

              {/* Guarantee / trust signals */}
              <div className="flex items-center gap-6 mt-8 text-xs font-medium" style={{ color: '#94A3B8' }}>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-400" />
                  Private & encrypted
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ---- Footer ---- */
export function Footer() {
  return (
    <footer
      className="py-12 px-6 border-t w-full flex justify-center"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <SaarLogo href="/home" size="xs" />

        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          &copy; {new Date().getFullYear()} SAAR. Personal Growth Intelligence.
        </p>

        <div className="flex gap-6">
          {['Privacy', 'Terms'].map((l) => (
            <Link
              key={l}
              href={`/${l.toLowerCase()}`}
              className="text-sm font-medium transition-colors hover:text-indigo-600"
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              {l}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
