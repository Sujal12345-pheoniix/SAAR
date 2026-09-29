'use client';

import React, { useState } from 'react';
import { LifeAreaIndicator, type LifeAreaType } from './LifeAreaIndicator';

export interface TaskRowProps {
  id: string;
  title: string;
  estimatedMinutes?: number;
  scheduledTime?: string;
  priority?: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  lifeArea?: LifeAreaType;
  goalTitle?: string;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
  onReschedule?: (id: string) => void;
  className?: string;
}

export function TaskRow({
  id,
  title,
  estimatedMinutes,
  scheduledTime,
  priority = 1,
  status,
  lifeArea,
  goalTitle,
  onComplete,
  onSkip,
  onReschedule,
  className = '',
}: TaskRowProps) {
  const [isPending, setIsPending] = useState(false);
  const isCompleted = status === 'COMPLETED';
  const isSkipped = status === 'SKIPPED';

  const handleToggle = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      if (isCompleted) {
        // Toggle back if needed, or trigger
      } else {
        await onComplete?.(id);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#16191F] rounded-lg border border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(15,17,21,0.18)] dark:hover:border-[rgba(255,255,255,0.18)] transition-all duration-150 ${
        isCompleted ? 'opacity-65 bg-[#FAF8F5] dark:bg-[#12141A]' : ''
      } ${className}`}
    >
      {/* Left Column: Checkbox & Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Accessible Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={`Mark task "${title}" as completed`}
          disabled={isPending || isSkipped}
          onClick={handleToggle}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226949] ${
            isCompleted
              ? 'bg-[#226949] border-[#226949] text-white dark:bg-[#4ADE80] dark:border-[#4ADE80] dark:text-[#0F1115]'
              : 'border-[rgba(15,17,21,0.24)] dark:border-[rgba(255,255,255,0.24)] hover:border-[#226949] dark:hover:border-[#4ADE80] bg-transparent'
          }`}
        >
          {isCompleted && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Title and Metadata */}
        <div className="flex flex-col min-w-0 pr-2">
          <span
            className={`text-sm font-medium text-[#0F1115] dark:text-[#FAF8F5] truncate transition-all duration-150 ${
              isCompleted ? 'line-through text-[#868E96] dark:text-[#868E96]' : ''
            }`}
          >
            {title}
          </span>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#868E96]">
            {scheduledTime && (
              <span className="tabular-nums font-medium text-[#495057] dark:text-[#CED4DA]">
                {scheduledTime}
              </span>
            )}
            {estimatedMinutes && (
              <span className="tabular-nums">
                {estimatedMinutes}m
              </span>
            )}
            {lifeArea && (
              <LifeAreaIndicator area={lifeArea} size="sm" />
            )}
            {goalTitle && (
              <span className="truncate max-w-[120px] hidden sm:inline" title={goalTitle}>
                • {goalTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Actions (Visible or hover-reveal) */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        {!isCompleted && !isSkipped && (
          <>
            {onReschedule && (
              <button
                type="button"
                onClick={() => onReschedule(id)}
                aria-label="Reschedule task"
                className="p-1.5 text-xs text-[#868E96] hover:text-[#0F1115] dark:hover:text-[#FAF8F5] hover:bg-[#F5F2EB] dark:hover:bg-[#272C37] rounded-md transition-colors"
                title="Reschedule"
              >
                🕒
              </button>
            )}
            {onSkip && (
              <button
                type="button"
                onClick={() => onSkip(id)}
                aria-label="Skip task"
                className="p-1.5 text-xs text-[#868E96] hover:text-[#9B2C2C] dark:hover:text-[#F87171] hover:bg-[rgba(197,48,48,0.06)] rounded-md transition-colors"
                title="Skip"
              >
                ✕
              </button>
            )}
          </>
        )}
        {isSkipped && (
          <span className="text-[11px] italic text-[#868E96]">Skipped</span>
        )}
      </div>
    </div>
  );
}
