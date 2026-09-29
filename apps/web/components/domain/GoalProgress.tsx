'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { LifeAreaIndicator, type LifeAreaType } from './LifeAreaIndicator';

export interface GoalProgressProps {
  id: string;
  title: string;
  lifeArea: LifeAreaType;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend?: 'improving' | 'stable' | 'declining';
  whyStatement?: string;
  targetDate?: string;
  nextAction?: string;
  className?: string;
  onSelect?: (id: string) => void;
}

export function GoalProgress({
  id,
  title,
  lifeArea,
  currentValue,
  targetValue,
  unit,
  trend = 'stable',
  whyStatement,
  targetDate,
  nextAction,
  className = '',
  onSelect,
}: GoalProgressProps) {
  const [expanded, setExpanded] = useState(false);
  const percentage = Math.min(100, Math.max(0, Math.round((currentValue / (targetValue || 1)) * 100)));

  const trendConfig = {
    improving: { label: 'Improving', color: 'text-[#226949] dark:text-[#4ADE80]', arrow: '↑' },
    stable: { label: 'Steady', color: 'text-[#B45309] dark:text-[#FBBF24]', arrow: '→' },
    declining: { label: 'Needs attention', color: 'text-[#9B2C2C] dark:text-[#F87171]', arrow: '↓' },
  };

  return (
    <Card
      variant="interactive"
      padding="none"
      className={`overflow-hidden ${className}`}
      onClick={() => onSelect?.(id)}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <LifeAreaIndicator area={lifeArea} size="sm" />
            <h3 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] mt-1 leading-snug">
              {title}
            </h3>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xl font-semibold tabular-nums text-[#0F1115] dark:text-[#FAF8F5]">
              {percentage}%
            </span>
            <span className={`text-[11px] font-medium flex items-center gap-0.5 ${trendConfig[trend].color}`}>
              <span>{trendConfig[trend].arrow}</span>
              <span>{trendConfig[trend].label}</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={percentage} variant="growth" size="sm" />

        {/* Numeric Destination */}
        <div className="flex items-center justify-between text-xs text-[#868E96] dark:text-[#CED4DA] tabular-nums">
          <span>Current: <strong className="text-[#0F1115] dark:text-[#FAF8F5]">{currentValue} {unit}</strong></span>
          <span>Target: <strong className="text-[#0F1115] dark:text-[#FAF8F5]">{targetValue} {unit}</strong></span>
        </div>

        {/* Next Action Anchor */}
        {nextAction && (
          <div className="mt-1 pt-2.5 border-t border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
            <span className="text-[#868E96]">Next action:</span>
            <span className="font-medium text-[#226949] dark:text-[#4ADE80] truncate max-w-[200px]">
              {nextAction}
            </span>
          </div>
        )}

        {/* Accordion toggle for "Why" */}
        {whyStatement && (
          <div className="pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="text-[11px] font-medium text-[#868E96] hover:text-[#0F1115] dark:hover:text-[#FAF8F5] flex items-center gap-1 transition-colors"
            >
              <span>{expanded ? 'Hide intention' : 'Why this destination matters'}</span>
              <span>{expanded ? '▴' : '▾'}</span>
            </button>
            {expanded && (
              <p className="mt-2 text-xs italic text-[#495057] dark:text-[#CED4DA] bg-[#FAF8F5] dark:bg-[#1D2129] p-3 rounded-md border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] leading-relaxed">
                &ldquo;{whyStatement}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
