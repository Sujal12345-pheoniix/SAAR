'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';

export interface SignalIndicatorProps {
  signalType: 'CONSISTENCY' | 'MOMENTUM' | 'BALANCE';
  score: number; // 0 to 100
  direction: 'UP' | 'DOWN' | 'STABLE';
  summary: string;
  rollingPeriod?: string;
  className?: string;
}

const signalConfig = {
  CONSISTENCY: {
    title: 'Consistency',
    description: 'Execution stability over rolling window',
    variant: 'growth' as const,
  },
  MOMENTUM: {
    title: 'Momentum',
    description: 'Velocity of completed habits vs prior cycle',
    variant: 'energy' as const,
  },
  BALANCE: {
    title: 'Life Balance',
    description: 'Distribution of deliberate time across life areas',
    variant: 'reflection' as const,
  },
};

export function SignalIndicator({
  signalType,
  score,
  direction,
  summary,
  rollingPeriod = 'Last 14 days',
  className = '',
}: SignalIndicatorProps) {
  const cfg = signalConfig[signalType] || signalConfig.CONSISTENCY;

  const directionArrow = {
    UP: { icon: '↑', color: 'text-[#226949] dark:text-[#4ADE80]', label: 'Trending up' },
    STABLE: { icon: '→', color: 'text-[#B45309] dark:text-[#FBBF24]', label: 'Stable' },
    DOWN: { icon: '↓', color: 'text-[#9B2C2C] dark:text-[#F87171]', label: 'Softening' },
  }[direction];

  return (
    <Card variant="default" padding="md" className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#868E96] font-semibold">
            {rollingPeriod}
          </span>
          <h4 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
            {cfg.title}
          </h4>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-[#0F1115] dark:text-[#FAF8F5]">
            {score}
          </span>
          <span className={`text-sm font-semibold ${directionArrow.color}`} title={directionArrow.label}>
            {directionArrow.icon}
          </span>
        </div>
      </div>

      <Progress value={score} variant={cfg.variant} size="sm" />

      <p className="text-xs text-[#495057] dark:text-[#CED4DA] leading-relaxed">
        {summary}
      </p>
    </Card>
  );
}
