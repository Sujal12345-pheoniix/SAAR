'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { FadeIn } from '@/components/motion/FadeIn';
import { ArrowRight } from 'lucide-react';

const RAW_SIGNALS = [
  { label: '7 workouts logged', icon: '💪', color: '#22C55E' },
  { label: '5.2h learning time', icon: '📚', color: '#06B6D4' },
  { label: '6.8h avg sleep', icon: '😴', color: '#8B5CF6' },
  { label: '4 missed habits', icon: '⚠️', color: '#F59E0B' },
  { label: '82% task rate', icon: '✅', color: '#6366F1' },
];

const INSIGHTS = [
  {
    observation: 'Your consistency drops 38% after high-workload days.',
    action: 'Consider scheduling recovery habits after intense work sessions.',
    confidence: 92,
  },
  {
    observation: 'You perform best when sleep exceeds 7.5 hours.',
    action: 'Moving workout to morning improves your energy through the day.',
    confidence: 88,
  },
  {
    observation: 'Learning and focus scores are deeply correlated for you.',
    action: 'Front-load your learning block before 10am for peak alignment.',
    confidence: 85,
  },
];

export function InsightsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [activeInsight, setActiveInsight] = useState(0);

  return (
    <section id="insights" className="py-32 px-6" style={{ background: 'var(--surface)' }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>
            Intelligence in Action
          </p>
          <h2 className="text-5xl font-bold mb-5" style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Raw data becomes<br />
            <span className="gradient-text">real clarity.</span>
          </h2>
          <p className="text-xl max-w-md mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            SAAR transforms what you do into insights you can actually act on.
          </p>
        </FadeIn>

        <div ref={ref} className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: Raw signals */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
              Raw Behavior — This Week
            </p>
            <div className="flex flex-col gap-3">
              {RAW_SIGNALS.map((sig, i) => (
                <motion.div
                  key={sig.label}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ x: 4 }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${sig.color}15` }}
                  >
                    {sig.icon}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{sig.label}</span>
                  <div className="ml-auto w-2 h-2 rounded-full" style={{ background: sig.color }} />
                </motion.div>
              ))}
            </div>

            {/* Arrow connector */}
            <div className="flex items-center justify-center my-6 lg:hidden">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight size={24} style={{ color: 'var(--accent)' }} className="rotate-90" />
              </motion.div>
            </div>
          </div>

          {/* Right: Insight output */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
              AI-Generated Insight
            </p>

            <div className="flex flex-col gap-3">
              {INSIGHTS.map((insight, i) => (
                <motion.button
                  key={i}
                  className="text-left w-full border-none cursor-pointer"
                  onClick={() => setActiveInsight(i)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="p-5 rounded-2xl transition-all"
                    animate={{
                      background: activeInsight === i
                        ? 'linear-gradient(145deg, #0B1020, #1a1f3a)'
                        : 'var(--bg)',
                      border: activeInsight === i
                        ? '1px solid rgba(99,102,241,0.3)'
                        : '1px solid var(--border)',
                      boxShadow: activeInsight === i
                        ? '0 4px 20px rgba(99,102,241,0.15)'
                        : 'none',
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: activeInsight === i ? 'rgba(255,255,255,0.9)' : 'var(--text-primary)', lineHeight: 1.5 }}
                    >
                      &ldquo;{insight.observation}&rdquo;
                    </p>
                    {activeInsight === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm mt-2 mb-4" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                          {insight.action}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: '#6366F1' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${insight.confidence}%` }}
                              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {insight.confidence}% confidence
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.button>
              ))}
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
    <section className="py-32 px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto text-center">
        <FadeIn>
          <div
            className="rounded-3xl p-16 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #0B1020 0%, #1a1f3a 100%)',
              boxShadow: '0 30px 80px rgba(11,16,32,0.25)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%)',
              }}
            />

            <div className="relative z-10">
              <div
                className="inline-block px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-8"
                style={{
                  background: 'rgba(99,102,241,0.2)',
                  color: '#818CF8',
                  border: '1px solid rgba(99,102,241,0.25)',
                  letterSpacing: '0.1em',
                }}
              >
                Begin your growth journey
              </div>

              <h2
                className="text-5xl font-bold text-white mb-6"
                style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}
              >
                Understand yourself.<br />
                Build what comes next.
              </h2>

              <p className="text-xl mb-10" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                SAAR is the intelligence layer between where you are and who you want to become.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                  <a
                    href="/register"
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base text-white"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                      boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                      textDecoration: 'none',
                    }}
                  >
                    Start for free
                    <ArrowRight size={16} />
                  </a>
                </motion.div>
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
      className="py-10 px-6 border-t"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
              <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" opacity="0.5"/>
              <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>SAAR</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          &copy; {new Date().getFullYear()} SAAR. Personal Growth Intelligence.
        </p>
        <div className="flex gap-6">
          {['Privacy', 'Terms'].map((l) => (
            <a key={l} href={`/${l.toLowerCase()}`} className="text-sm" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
