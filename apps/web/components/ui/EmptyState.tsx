'use client';

import React, { type ReactNode } from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-[rgba(15,17,21,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-[#FAF8F5]/60 dark:bg-[#16191F]/40 ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[#EFECE4] dark:bg-[#272C37] text-[#495057] dark:text-[#CED4DA] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] mb-1.5 max-w-sm">
        {title}
      </h3>
      <p className="text-sm text-[#868E96] dark:text-[#868E96] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
