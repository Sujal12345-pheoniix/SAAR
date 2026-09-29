'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface TradeoffAdjustment {
  id: string;
  action: string;
  title: string;
  timeRecoveredMinutes: number;
}

export interface TradeoffCardProps {
  currentLoadMinutes: number;
  capacityMinutes: number;
  overloadMinutes: number;
  adjustments: TradeoffAdjustment[];
  onApplyAdjustment?: (adjustmentId: string) => void;
  className?: string;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TradeoffCard({
  currentLoadMinutes,
  capacityMinutes,
  overloadMinutes,
  adjustments,
  onApplyAdjustment,
  className = '',
}: TradeoffCardProps) {
  const isOverloaded = overloadMinutes > 0;

  if (!isOverloaded && adjustments.length === 0) {
    return (
      <Card variant="subtle" padding="md" className={`flex items-center justify-between ${className}`}>
        <div>
          <span className="text-xs uppercase tracking-wider text-[#226949] dark:text-[#4ADE80] font-semibold block">
            Plan In Equilibrium
          </span>
          <p className="text-xs text-[#868E96] mt-0.5">
            Planned load ({formatMinutes(currentLoadMinutes)}) sits comfortably within typical capacity ({formatMinutes(capacityMinutes)}).
          </p>
        </div>
        <Badge variant="growth" size="sm">Balanced</Badge>
      </Card>
    );
  }

  return (
    <Card
      variant="default"
      padding="md"
      className={`border-l-4 border-l-[#9B2C2C] dark:border-l-[#F87171] flex flex-col gap-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#9B2C2C] dark:text-[#F87171]">
              Capacity Overload Detected
            </span>
            <Badge variant="attention" size="sm">
              +{formatMinutes(overloadMinutes)} excess
            </Badge>
          </div>
          <p className="text-xs text-[#868E96] mt-1">
            Planned schedule ({formatMinutes(currentLoadMinutes)}) exceeds your typical sustainable capacity ({formatMinutes(capacityMinutes)}).
          </p>
        </div>
      </div>

      {/* Adjustments list */}
      {adjustments.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
          <span className="text-xs font-semibold text-[#343A40] dark:text-[#CED4DA]">
            Recommended Adaptive Adjustments:
          </span>
          <div className="flex flex-col gap-1.5">
            {adjustments.map((adj) => (
              <div
                key={adj.id}
                className="flex items-center justify-between p-2.5 bg-[#FAF8F5] dark:bg-[#12141A] rounded-md border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="font-medium text-[#0F1115] dark:text-[#FAF8F5] truncate">
                    {adj.action}: {adj.title}
                  </span>
                  <span className="text-[#226949] dark:text-[#4ADE80] font-semibold shrink-0">
                    (-{formatMinutes(adj.timeRecoveredMinutes)})
                  </span>
                </div>
                {onApplyAdjustment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApplyAdjustment(adj.id)}
                    className="shrink-0 text-xs py-1 px-2.5"
                  >
                    Adjust
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
