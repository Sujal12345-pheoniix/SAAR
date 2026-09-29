'use client';

import React, { type ReactNode, type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'subtle' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default:
    'bg-white dark:bg-[#16191F] border border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)] shadow-[0_1px_3px_0_rgba(15,17,21,0.04)]',
  subtle:
    'bg-[#FDFCFB] dark:bg-[#12141A] border border-[rgba(15,17,21,0.05)] dark:border-[rgba(255,255,255,0.05)]',
  elevated:
    'bg-white dark:bg-[#1D2129] border border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.1)] shadow-[0_4px_16px_rgba(15,17,21,0.06)]',
  interactive:
    'bg-white dark:bg-[#16191F] border border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(15,17,21,0.18)] dark:hover:border-[rgba(255,255,255,0.18)] hover:shadow-[0_4px_12px_rgba(15,17,21,0.06)] cursor-pointer transition-all duration-150',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden transition-colors ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
