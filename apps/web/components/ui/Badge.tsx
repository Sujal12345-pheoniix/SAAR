'use client';

import React, { type ReactNode } from 'react';

export type BadgeVariant = 'growth' | 'energy' | 'reflection' | 'attention' | 'recovery' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  growth:
    'bg-[rgba(46,125,91,0.1)] text-[#226949] border-[rgba(46,125,91,0.2)] dark:bg-[rgba(74,222,128,0.15)] dark:text-[#4ADE80] dark:border-[rgba(74,222,128,0.3)]',
  energy:
    'bg-[rgba(217,119,6,0.1)] text-[#B45309] border-[rgba(217,119,6,0.2)] dark:bg-[rgba(251,191,36,0.15)] dark:text-[#FBBF24] dark:border-[rgba(251,191,36,0.3)]',
  reflection:
    'bg-[rgba(91,94,166,0.1)] text-[#4D5091] border-[rgba(91,94,166,0.2)] dark:bg-[rgba(129,140,248,0.15)] dark:text-[#818CF8] dark:border-[rgba(129,140,248,0.3)]',
  attention:
    'bg-[rgba(197,48,48,0.1)] text-[#9B2C2C] border-[rgba(197,48,48,0.2)] dark:bg-[rgba(248,113,113,0.15)] dark:text-[#F87171] dark:border-[rgba(248,113,113,0.3)]',
  recovery:
    'bg-[rgba(13,148,136,0.1)] text-[#0F766E] border-[rgba(13,148,136,0.2)] dark:bg-[rgba(45,212,191,0.15)] dark:text-[#2DD4BF] dark:border-[rgba(45,212,191,0.3)]',
  neutral:
    'bg-[#F5F2EB] text-[#495057] border-[rgba(15,17,21,0.1)] dark:bg-[#1D2129] dark:text-[#CED4DA] dark:border-[rgba(255,255,255,0.1)]',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  icon,
}: BadgeProps) {
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide uppercase ${variantStyles[variant]} ${sizeClasses} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
