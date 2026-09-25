'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { FadeIn } from '@/components/motion/FadeIn';

const LIFE_AREAS = [
  { id: 'health',    label: 'Health',        emoji: '💪', color: '#22C55E', angle: -90,   progress: 82, detail: 'Workouts · Sleep · Recovery · Nutrition' },
  { id: 'career',    label: 'Career',         emoji: '🚀', color: '#6366F1', angle: -30,   progress: 68, detail: 'Deep work · Skills · Projects · Growth' },
  { id: 'learning',  label: 'Learning',       emoji: '📚', color: '#06B6D4', angle: 30,    progress: 75, detail: 'Reading · Courses · Reflection · Practice' },
  { id: 'mind',      label: 'Mind',           emoji: '🧘', color: '#8B5CF6', angle: 90,    progress: 61, detail: 'Meditation · Journaling · Focus · Clarity' },
  { id: 'relations', label: 'Relationships',  emoji: '❤️', color: '#F59E0B', angle: 150,   progress: 70, detail: 'Family · Friends · Quality time · Connection' },
  { id: 'finance',   label: 'Finance',        emoji: '💰', color: '#10B981', angle: 210,   progress: 55, detail: 'Savings · Investments · Budget · Goals' },
];

function toRadians(deg: number) { return deg * (Math.PI / 180); }

interface AreaNodeProps {
  area: typeof LIFE_AREAS[0];
  radius: number;
  active: boolean;
  onClick: () => void;
}

function AreaNode({ area, radius, active, onClick }: AreaNodeProps) {
  const rad = toRadians(area.angle);
  const cx = Math.cos(rad) * radius;
  const cy = Math.sin(rad) * radius;

  return (
    <motion.button
      onClick={onClick}
      className="absolute flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent"
      style={{
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`,
      }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.96 }}
      aria-label={area.label}
    >
      <motion.div
        className="flex flex-col items-center gap-1.5"
        animate={{
          filter: active ? `drop-shadow(0 0 12px ${area.color}80)` : 'none',
        }}
      >
        {/* Node circle */}
        <motion.div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl relative"
          animate={{
            background: active ? area.color : 'rgba(255,255,255,0.95)',
            boxShadow: active
              ? `0 0 0 4px ${area.color}20, 0 8px 24px ${area.color}30`
              : '0 2px 12px rgba(11,16,32,0.08)',
            border: `2px solid ${active ? area.color : 'rgba(11,16,32,0.06)'}`,
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {area.emoji}
          {/* Progress ring */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 64 64"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle cx="32" cy="32" r="29" fill="none" stroke={`${area.color}20`} strokeWidth="2" />
            <motion.circle
              cx="32" cy="32" r="29"
              fill="none"
              stroke={area.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 29}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 29 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 29 * (1 - area.progress / 100) }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        </motion.div>
        <span
          className="text-xs font-semibold leading-none"
          style={{ color: active ? area.color : 'var(--text-secondary)' }}
        >
          {area.label}
        </span>
      </motion.div>
    </motion.button>
  );
}

export function HabitEcosystem() {
  const [active, setActive] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const activeArea = LIFE_AREAS.find((a) => a.id === active);

  return (
    <section className="py-32 px-6 w-full flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-6xl mx-auto" style={{ width: '100%', maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>
        <FadeIn className="text-center mb-20 w-full flex flex-col items-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>
            Life Intelligence Map
          </p>
          <h2 className="text-5xl font-bold mb-5 text-center" style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Every area of your life,<br />connected.
          </h2>
          <p className="text-xl max-w-md mx-auto text-center" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginLeft: 'auto', marginRight: 'auto' }}>
            SAAR tracks all six pillars of your life and shows how they interact and reinforce each other.
          </p>
        </FadeIn>

        <div ref={ref} className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 justify-center w-full max-w-5xl mx-auto" style={{ width: '100%', maxWidth: '64rem', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Radial ecosystem */}
          <motion.div
            className="relative flex-shrink-0"
            style={{ width: 420, height: 420 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Outer orbital rings */}
            {[140, 160, 180].map((r, i) => (
              <div
                key={r}
                className="absolute rounded-full border"
                style={{
                  width: r * 2,
                  height: r * 2,
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%)`,
                  borderColor: `rgba(99,102,241,${0.06 - i * 0.015})`,
                }}
              />
            ))}

            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              {LIFE_AREAS.map((area) => {
                const rad = toRadians(area.angle);
                const r = 150;
                const x = 210 + Math.cos(rad) * r;
                const y = 210 + Math.sin(rad) * r;
                return (
                  <motion.line
                    key={area.id}
                    x1={210} y1={210} x2={x} y2={y}
                    stroke={area.color}
                    strokeWidth="1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: active === area.id ? 0.5 : 0.1 }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })}
            </svg>

            {/* Center YOU node */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-full z-10"
              style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: '0 0 40px rgba(99,102,241,0.35)',
              }}
              animate={isInView ? { scale: [0.8, 1.05, 1] } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-lg font-bold text-white">YOU</span>
            </motion.div>

            {/* Area nodes */}
            {LIFE_AREAS.map((area) => (
              <AreaNode
                key={area.id}
                area={area}
                radius={150}
                active={active === area.id}
                onClick={() => setActive(active === area.id ? null : area.id)}
              />
            ))}
          </motion.div>

          {/* Detail panel */}
          <div className="flex-1 max-w-md lg:max-w-lg w-full">
            <motion.div
              key={active ?? 'none'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
            >
              {!activeArea ? (
                <div>
                  <h3 className="text-3xl font-bold mb-4" style={{ letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                    Click any life area to explore
                  </h3>
                  <p className="text-lg" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    Each node represents a core dimension of your life. SAAR tracks activity, trends, and insights across all of them simultaneously.
                  </p>
                  <div className="mt-8 flex flex-col gap-3">
                    {LIFE_AREAS.map((a) => (
                      <div key={a.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {a.label}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: a.color }}
                            initial={{ width: 0 }}
                            animate={isInView ? { width: `${a.progress}%` } : {}}
                            transition={{ duration: 0.8, delay: 0.1 * LIFE_AREAS.indexOf(a), ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                          {a.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: `${activeArea.color}18`, border: `2px solid ${activeArea.color}30` }}
                    >
                      {activeArea.emoji}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold" style={{ letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                        {activeArea.label}
                      </h3>
                      <p className="text-sm" style={{ color: activeArea.color, fontWeight: 600 }}>
                        {activeArea.progress}% engagement
                      </p>
                    </div>
                  </div>

                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {activeArea.detail}
                  </p>

                  {/* Mock insight */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: `${activeArea.color}10`, border: `1px solid ${activeArea.color}20` }}
                  >
                    <p className="text-xs font-semibold mb-2" style={{ color: activeArea.color }}>
                      💡 SAAR Insight
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {activeArea.id === 'health' && 'Your recovery habits directly correlate with next-day focus scores. Consider prioritizing sleep consistency.'}
                      {activeArea.id === 'career' && 'Deep work blocks before noon show 2x better output for you. Protect your mornings.'}
                      {activeArea.id === 'learning' && 'You retain more when you read before your main task block. Try front-loading learning daily.'}
                      {activeArea.id === 'mind' && 'Meditation streaks correlate with reduced task-switching for you. Even 5 minutes matters.'}
                      {activeArea.id === 'relations' && 'You feel most aligned on weekends — consider scheduling connection rituals during the week too.'}
                      {activeArea.id === 'finance' && 'Your financial tracking consistency is improving. Adding a weekly review habit could accelerate this.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
