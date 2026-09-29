'use client';

import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'growth' | 'energy' | 'reflection' | 'attention' | 'recovery';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantBars = {
  growth: 'bg-[#226949] dark:bg-[#4ADE80]',
  energy: 'bg-[#B45309] dark:bg-[#FBBF24]',
  reflection: 'bg-[#4D5091] dark:bg-[#818CF8]',
  attention: 'bg-[#9B2C2C] dark:bg-[#F87171]',
  recovery: 'bg-[#0F766E] dark:bg-[#2DD4BF]',
};

const sizeStyles = {
  sm: 'h-1.5 rounded-xs',
  md: 'h-2.5 rounded-sm',
  lg: 'h-4 rounded-md',
};

export function Progress({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = 'growth',
  size = 'md',
  className = '',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium text-[#495057] dark:text-[#CED4DA]">
          {label && <span>{label}</span>}
          {showPercentage && <span className="tabular-nums font-semibold">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        className={`w-full bg-[#EFECE4] dark:bg-[#272C37] overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${variantBars[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
