'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface GapIndicatorProps {
  gapType: 'QUANTITY' | 'CONSISTENCY' | 'EXECUTION' | 'PRIORITY' | 'BALANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  observedMetric: string;
  targetMetric: string;
  description: string;
  hypothesis?: string;
  recommendedExperiment?: string;
  onExploreExperiment?: () => void;
  className?: string;
}

const severityBadgeMap = {
  LOW: { variant: 'recovery' as const, label: 'Gentle Adjustment' },
  MEDIUM: { variant: 'energy' as const, label: 'Noticeable Gap' },
  HIGH: { variant: 'attention' as const, label: 'High Tension' },
};

export function GapIndicator({
  gapType,
  severity,
  observedMetric,
  targetMetric,
  description,
  hypothesis,
  recommendedExperiment,
  onExploreExperiment,
  className = '',
}: GapIndicatorProps) {
  const badge = severityBadgeMap[severity] || severityBadgeMap.LOW;

  return (
    <Card variant="default" padding="md" className={`flex flex-col gap-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#868E96]">
          Gap Engine • {gapType}
        </span>
        <Badge variant={badge.variant} size="sm">
          {badge.label}
        </Badge>
      </div>

      {/* Tension Comparison */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF8F5] dark:bg-[#12141A] rounded-lg border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] text-xs">
        <div>
          <span className="text-[#868E96] block mb-0.5">Observed Reality:</span>
          <span className="font-semibold text-[#0F1115] dark:text-[#FAF8F5] text-sm tabular-nums">
            {observedMetric}
          </span>
        </div>
        <div>
          <span className="text-[#868E96] block mb-0.5">Desired Intention:</span>
          <span className="font-semibold text-[#226949] dark:text-[#4ADE80] text-sm tabular-nums">
            {targetMetric}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#495057] dark:text-[#CED4DA] leading-relaxed">
        {description}
      </p>

      {/* Hypothesis if available */}
      {hypothesis && (
        <div className="p-3 bg-[rgba(91,94,166,0.06)] dark:bg-[rgba(129,140,248,0.08)] rounded-md border border-[rgba(91,94,166,0.14)] text-xs text-[#4D5091] dark:text-[#818CF8]">
          <strong className="block font-semibold mb-0.5">Working Hypothesis:</strong>
          <span>{hypothesis}</span>
        </div>
      )}

      {/* Actionable Micro-Experiment */}
      {recommendedExperiment && (
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
          <div className="text-xs">
            <span className="text-[#868E96] block">Available Experiment:</span>
            <span className="font-medium text-[#0F1115] dark:text-[#FAF8F5]">
              {recommendedExperiment}
            </span>
          </div>
          {onExploreExperiment && (
            <Button variant="secondary" size="sm" onClick={onExploreExperiment}>
              Test Experiment
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
