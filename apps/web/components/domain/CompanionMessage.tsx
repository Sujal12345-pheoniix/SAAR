'use client';

import React from 'react';
import { Button } from '../ui/Button';

export interface ActionProposal {
  id: string;
  type: string;
  title: string;
  description: string;
  requiresConfirmation: boolean;
  status: 'PROPOSED' | 'CONFIRMED' | 'REJECTED';
}

export interface CompanionMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  facts?: string[];
  signals?: string[];
  hypotheses?: string[];
  suggestions?: string[];
  actions?: ActionProposal[];
  onConfirmAction?: (actionId: string) => void;
  onRejectAction?: (actionId: string) => void;
  className?: string;
}

export function CompanionMessage({
  role,
  content,
  timestamp,
  facts,
  signals,
  hypotheses,
  suggestions,
  actions,
  onConfirmAction,
  onRejectAction,
  className = '',
}: CompanionMessageProps) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div className={`flex flex-col items-end my-3 ${className}`}>
        <div className="max-w-[85%] sm:max-w-[70%] bg-[#0F1115] text-[#FAF8F5] dark:bg-[#FAF8F5] dark:text-[#0F1115] px-4 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed shadow-xs">
          {content}
        </div>
        <span className="text-[10px] text-[#868E96] mt-1 mr-1 tabular-nums">
          {timestamp}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start my-4 max-w-[95%] sm:max-w-[85%] ${className}`}>
      {/* Assistant bubble */}
      <div className="bg-white dark:bg-[#16191F] border border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)] p-5 rounded-2xl rounded-tl-xs shadow-xs text-sm text-[#0F1115] dark:text-[#FAF8F5] leading-relaxed flex flex-col gap-3.5">
        {/* Editorial Content */}
        <p className="whitespace-pre-wrap font-sans text-sm">
          {content}
        </p>

        {/* Separated Grounding Tiers: Facts, Signals, Hypotheses */}
        {(facts?.length || signals?.length || hypotheses?.length) ? (
          <div className="flex flex-col gap-2 pt-3 border-t border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] text-xs">
            {facts && facts.length > 0 && (
              <div className="flex items-start gap-2 bg-[#FAF8F5] dark:bg-[#12141A] p-2.5 rounded-md">
                <span className="font-semibold text-[#226949] dark:text-[#4ADE80] shrink-0 uppercase tracking-wide text-[10px]">
                  Observed Fact:
                </span>
                <span className="text-[#495057] dark:text-[#CED4DA]">{facts.join('; ')}</span>
              </div>
            )}
            {signals && signals.length > 0 && (
              <div className="flex items-start gap-2 bg-[#FAF8F5] dark:bg-[#12141A] p-2.5 rounded-md">
                <span className="font-semibold text-[#B45309] dark:text-[#FBBF24] shrink-0 uppercase tracking-wide text-[10px]">
                  Derived Signal:
                </span>
                <span className="text-[#495057] dark:text-[#CED4DA]">{signals.join('; ')}</span>
              </div>
            )}
            {hypotheses && hypotheses.length > 0 && (
              <div className="flex items-start gap-2 bg-[rgba(91,94,166,0.06)] dark:bg-[rgba(129,140,248,0.08)] p-2.5 rounded-md">
                <span className="font-semibold text-[#4D5091] dark:text-[#818CF8] shrink-0 uppercase tracking-wide text-[10px]">
                  Hypothesis:
                </span>
                <span className="text-[#4D5091] dark:text-[#818CF8] italic">{hypotheses.join('; ')}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Action Proposals requiring user confirmation */}
        {actions && actions.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-3 border-t border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)]">
            <span className="text-xs font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
              Proposed Action (Requires Confirmation):
            </span>
            {actions.map((act) => (
              <div
                key={act.id}
                className="p-3 bg-[#FAF8F5] dark:bg-[#12141A] rounded-lg border border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-2"
              >
                <div>
                  <strong className="text-xs font-medium text-[#0F1115] dark:text-[#FAF8F5] block">
                    {act.title}
                  </strong>
                  <p className="text-xs text-[#868E96] mt-0.5">{act.description}</p>
                </div>
                {act.status === 'PROPOSED' ? (
                  (onConfirmAction || onRejectAction) ? (
                    <div className="flex items-center gap-2 pt-1">
                      {onConfirmAction && (
                        <Button
                          variant="growth"
                          size="sm"
                          onClick={() => onConfirmAction(act.id)}
                        >
                          Confirm Action
                        </Button>
                      )}
                      {onRejectAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRejectAction(act.id)}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#868E96] italic">
                      Action application is currently unavailable.
                    </span>
                  )
                ) : (
                  <span className="text-[11px] font-semibold text-[#226949] dark:text-[#4ADE80]">
                    ✓ Action {act.status.toLowerCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="text-[10px] text-[#868E96] mt-1.5 ml-2 tabular-nums">
        SAAR Companion • {timestamp}
      </span>
    </div>
  );
}
