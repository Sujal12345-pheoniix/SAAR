'use client';

import React from 'react';
import { LifeAreaIcon, type LifeAreaType } from '../icons/LifeAreaIcons';

export type { LifeAreaType };

export interface LifeAreaIndicatorProps {
  area: LifeAreaType;
  label?: string;
  score?: number;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const areaConfig: Record<LifeAreaType, { name: string; color: string; bgLight: string; border: string }> = {
  mind: {
    name: 'Mind',
    color: '#4D5091', // Slate Indigo
    bgLight: 'rgba(77, 80, 145, 0.08)',
    border: 'rgba(77, 80, 145, 0.2)',
  },
  health: {
    name: 'Health',
    color: '#226949', // Forest Sage
    bgLight: 'rgba(34, 105, 73, 0.08)',
    border: 'rgba(34, 105, 73, 0.2)',
  },
  career: {
    name: 'Career',
    color: '#B45309', // Warm Amber
    bgLight: 'rgba(180, 83, 9, 0.08)',
    border: 'rgba(180, 83, 9, 0.2)',
  },
  relationships: {
    name: 'Relationships',
    color: '#9B2C2C', // Deep Rose / Attention
    bgLight: 'rgba(155, 44, 44, 0.08)',
    border: 'rgba(155, 44, 44, 0.2)',
  },
  personal: {
    name: 'Personal',
    color: '#495057', // Graphite
    bgLight: 'rgba(73, 80, 87, 0.08)',
    border: 'rgba(73, 80, 87, 0.2)',
  },
  finance: {
    name: 'Finance',
    color: '#0F766E', // Deep Teal
    bgLight: 'rgba(15, 118, 110, 0.08)',
    border: 'rgba(15, 118, 110, 0.2)',
  },
  purpose: {
    name: 'Purpose',
    color: '#8C6D3B', // Quiet Bronze
    bgLight: 'rgba(140, 109, 59, 0.08)',
    border: 'rgba(140, 109, 59, 0.2)',
  },
};

export function LifeAreaIndicator({
  area,
  label,
  score,
  showIcon = true,
  className = '',
  size = 'md',
}: LifeAreaIndicatorProps) {
  const normArea = area.toLowerCase() as LifeAreaType;
  const config = areaConfig[normArea] || areaConfig.mind;
  const displayLabel = label || config.name;

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      style={{
        backgroundColor: config.bgLight,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      {showIcon && (
        <LifeAreaIcon
          area={normArea}
          size={isSmall ? 12 : 14}
          color={config.color}
          strokeWidth={2}
        />
      )}
      <span>{displayLabel}</span>
      {score !== undefined && (
        <span
          className="font-semibold tabular-nums ml-0.5 opacity-90"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {score}%
        </span>
      )}
    </div>
  );
}
