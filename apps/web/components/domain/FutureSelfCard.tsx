'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { LifeAreaIndicator, type LifeAreaType } from './LifeAreaIndicator';

export interface DesiredStateItem {
  area: LifeAreaType;
  vision: string;
  supportingBehaviors: string[];
}

export interface FutureSelfCardProps {
  identityStatement: string;
  targetHorizon: string; // e.g., "5-Year Horizon (2031)"
  desiredStates: DesiredStateItem[];
  currentEvidenceCount?: number;
  onEdit?: () => void;
  className?: string;
}

export function FutureSelfCard({
  identityStatement,
  targetHorizon,
  desiredStates,
  currentEvidenceCount = 0,
  onEdit,
  className = '',
}: FutureSelfCardProps) {
  return (
    <Card variant="default" padding="lg" className={`flex flex-col gap-5 ${className}`}>
      {/* Editorial Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#868E96] font-semibold block mb-1">
            Future Self • {targetHorizon}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] leading-snug">
            &ldquo;{identityStatement}&rdquo;
          </h2>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-[#4D5091] dark:text-[#818CF8] hover:underline"
          >
            Refine Vision
          </button>
        )}
      </div>

      {/* Desired States across Life Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
        {desiredStates.map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#FAF8F5] dark:bg-[#12141A] rounded-lg border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <LifeAreaIndicator area={item.area} size="sm" />
            </div>
            <p className="text-xs font-medium text-[#0F1115] dark:text-[#FAF8F5] leading-relaxed">
              {item.vision}
            </p>
            {item.supportingBehaviors.length > 0 && (
              <div className="mt-1">
                <span className="text-[10px] uppercase font-semibold text-[#868E96] block mb-1">
                  Required Daily Cadence:
                </span>
                <ul className="text-xs text-[#495057] dark:text-[#CED4DA] space-y-0.5 list-disc list-inside">
                  {item.supportingBehaviors.map((b, bIdx) => (
                    <li key={bIdx} className="truncate">{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Evidence Anchor Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] text-xs text-[#868E96]">
        <span>Current Connected Behaviors: <strong className="text-[#0F1115] dark:text-[#FAF8F5]">{currentEvidenceCount} logged</strong></span>
        <span className="italic">Every habit today moves you closer to this person.</span>
      </div>
    </Card>
  );
}
