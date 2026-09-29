'use client';

import React from 'react';

export interface GrowthRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  accentColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function GrowthRing({
  progress,
  size = 120,
  strokeWidth = 8,
  accentColor = '#226949',
  label,
  sublabel,
  className = '',
}: GrowthRingProps) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={safeProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Growth Progress'}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#EFECE4] dark:text-[#272C37]"
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl sm:text-2xl font-semibold tabular-nums text-[#0F1115] dark:text-[#FAF8F5]">
          {safeProgress}%
        </span>
        {label && (
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-medium text-[#868E96] mt-0.5">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-[#868E96] opacity-80">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
