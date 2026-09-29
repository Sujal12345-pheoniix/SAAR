'use client';

import React from 'react';

export type LifeAreaType = 'mind' | 'health' | 'career' | 'relationships' | 'personal' | 'finance' | 'purpose';

export interface LifeAreaIndicatorProps {
  area: LifeAreaType;
  label?: string;
  score?: number;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const areaConfig: Record<LifeAreaType, { name: string; color: string; bgLight: string; bgDark: string }> = {
  mind: {
    name: 'Mind',
    color: '#6366F1',
    bgLight: 'rgba(99, 102, 241, 0.1)',
    bgDark: 'rgba(129, 140, 248, 0.15)',
  },
  health: {
    name: 'Health',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.1)',
    bgDark: 'rgba(52, 211, 153, 0.15)',
  },
  career: {
    name: 'Career',
    color: '#0284C7',
    bgLight: 'rgba(2, 132, 199, 0.1)',
    bgDark: 'rgba(56, 189, 248, 0.15)',
  },
  relationships: {
    name: 'Relationships',
    color: '#EC4899',
    bgLight: 'rgba(236, 72, 153, 0.1)',
    bgDark: 'rgba(244, 114, 182, 0.15)',
  },
  personal: {
    name: 'Personal',
    color: '#F59E0B',
    bgLight: 'rgba(245, 158, 11, 0.1)',
    bgDark: 'rgba(251, 191, 36, 0.15)',
  },
  finance: {
    name: 'Finance',
    color: '#14B8A6',
    bgLight: 'rgba(20, 184, 166, 0.1)',
    bgDark: 'rgba(45, 212, 191, 0.15)',
  },
  purpose: {
    name: 'Purpose',
    color: '#8B5CF6',
    bgLight: 'rgba(139, 92, 246, 0.1)',
    bgDark: 'rgba(167, 139, 250, 0.15)',
  },
};

export function LifeAreaIndicator({
  area,
  label,
  score,
  className = '',
  size = 'md',
}: LifeAreaIndicatorProps) {
  const cfg = areaConfig[area] || areaConfig.mind;
  const displayName = label || cfg.name;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-transparent ${sizeClasses} ${className}`}
      style={{
        backgroundColor: cfg.bgLight,
        color: cfg.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: cfg.color }}
        aria-hidden="true"
      />
      <span>{displayName}</span>
      {score !== undefined && (
        <span className="tabular-nums font-semibold opacity-90 ml-0.5">
          {score}
        </span>
      )}
    </span>
  );
}
