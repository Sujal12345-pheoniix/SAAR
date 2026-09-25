'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ProgressRing } from '@/components/ui/Metrics';

interface MomentumScoreProps {
  score: number; // 0-100
  label?: string;
  breakdown?: Array<{ label: string; value: number; color: string }>;
}

export function MomentumScore({ score, label = 'Life Alignment', breakdown = [] }: MomentumScoreProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const scoreColor =
    score >= 80 ? '#22C55E' :
    score >= 60 ? '#6366F1' :
    score >= 40 ? '#F59E0B' : '#EF4444';

  const gradeLabel =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good' :
    score >= 40 ? 'Building' : 'Just Starting';

  return (
    <div
      ref={ref}
      className="stat-card flex flex-col items-center gap-6"
    >
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
            {label}
          </h3>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Momentum Score
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${scoreColor}18`, color: scoreColor }}
        >
          {gradeLabel}
        </div>
      </div>

      <ProgressRing
        value={score}
        size={160}
        strokeWidth={10}
        color={scoreColor}
        trackColor={`${scoreColor}18`}
        animated
      >
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {score}
          </span>
          <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>out of 100</span>
        </div>
      </ProgressRing>

      {breakdown.length > 0 && (
        <div className="w-full flex flex-col gap-3">
          {breakdown.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${item.value}%` } : {}}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color: 'var(--text-secondary)' }}>
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
