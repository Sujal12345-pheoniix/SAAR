'use client';

import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something interrupted this.',
  message = 'Your progress is safe. You can try refreshing or continuing where you left off.',
  retryLabel = 'Try again',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-[rgba(197,48,48,0.2)] bg-[rgba(197,48,48,0.04)] dark:bg-[rgba(248,113,113,0.06)] dark:border-[rgba(248,113,113,0.2)] ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[rgba(197,48,48,0.1)] text-[#9B2C2C] dark:text-[#F87171] flex items-center justify-center mb-3.5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#495057] dark:text-[#CED4DA] max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
