'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { SignalIndicator } from '@/components/domain/SignalIndicator';
import { GapIndicator } from '@/components/domain/GapIndicator';
import { LifeAreaIndicator } from '@/components/domain/LifeAreaIndicator';
import { DailyGrowthStep } from '@/components/domain/DailyGrowthStep';
import { GrowthRing } from '@/components/domain/GrowthRing';
import { Skeleton } from '@/components/ui/Skeleton';

export default function GrowthPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'daily-growth'>('overview');
  const [dailyStep, setDailyStep] = useState(1);
  const [reflectionInput, setReflectionInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const gaps = [
    {
      type: 'CONSISTENCY' as const,
      severity: 'MEDIUM' as const,
      observed: '3 out of 7 evening wind-down routines completed',
      target: '6 out of 7 weekly consistency',
      description: 'Your late evening routine shows degradation on Wednesday and Thursday after intense afternoon deploy schedules.',
      hypothesis: 'Late cognitively demanding meetings are encroaching on shutdown time.',
      experiment: 'Anchor hard laptop close at 8:00 PM with phone docked in living room.',
    },
    {
      type: 'QUANTITY' as const,
      severity: 'LOW' as const,
      observed: '140 minutes aerobic zone 2 logged this week',
      target: '180 minutes target',
      description: 'You are within 40 minutes of your weekly endurance volume.',
      hypothesis: 'Splitting the remaining time into two 20-minute morning recovery jogs will comfortably close the deficit.',
      experiment: 'Test 20-minute early morning jog before Thursday standup.',
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#868E96] font-semibold block mb-1">
            Growth Intelligence Engine
          </span>
          <h1 className="text-3xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
            Growth & Patterns.
          </h1>
        </div>
        <Tabs
          size="sm"
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as any)}
          tabs={[
            { id: 'overview', label: 'Signal Overview' },
            { id: 'gaps', label: 'Gap Engine', count: gaps.length },
            { id: 'daily-growth', label: 'Daily Growth Sequence' },
          ]}
        />
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          {/* Signal Cards */}
          <div>
            <h3 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] mb-4">
              Deterministic Evidence Signals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SignalIndicator
                signalType="CONSISTENCY"
                score={84}
                direction="UP"
                summary="Execution regularity has steadily climbed from 72% over the last 14 days."
              />
              <SignalIndicator
                signalType="MOMENTUM"
                score={79}
                direction="STABLE"
                summary="Task completion velocity stable with 24 total actions logged this week."
              />
              <SignalIndicator
                signalType="BALANCE"
                score={88}
                direction="UP"
                summary="Strong equitable allocation across Health (35%), Career (40%), and Mind (25%)."
              />
            </div>
          </div>

          {/* Life Area Balance Grid */}
          <Card variant="default" padding="lg">
            <h3 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] mb-2">
              Life Area Balance & Execution Distribution
            </h3>
            <p className="text-xs text-[#868E96] mb-5">
              Verified behavioral hours invested across life areas over the past rolling 30 days.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { area: 'health' as const, hours: 28, score: 92 },
                { area: 'career' as const, hours: 64, score: 88 },
                { area: 'mind' as const, hours: 18, score: 76 },
                { area: 'relationships' as const, hours: 14, score: 70 },
              ].map((item) => (
                <div
                  key={item.area}
                  className="p-4 bg-[#FAF8F5] dark:bg-[#12141A] rounded-lg border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] flex flex-col gap-2"
                >
                  <LifeAreaIndicator area={item.area} size="sm" />
                  <span className="text-2xl font-bold tabular-nums text-[#0F1115] dark:text-[#FAF8F5] mt-1">
                    {item.hours}h
                  </span>
                  <span className="text-[11px] text-[#868E96]">
                    Execution index: {item.score}/100
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Gap Engine */}
      {activeTab === 'gaps' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#868E96] max-w-xl leading-relaxed">
              The Gap Engine compares real logged activity against your target commitments. Gaps are not personal judgments; they are neutral signals for adaptive calibration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {gaps.map((gap, i) => (
              <GapIndicator
                key={i}
                gapType={gap.type}
                severity={gap.severity}
                observedMetric={gap.observed}
                targetMetric={gap.target}
                description={gap.description}
                hypothesis={gap.hypothesis}
                recommendedExperiment={gap.experiment}
                onExploreExperiment={() => {
                  alert(`Activated micro-experiment: "${gap.experiment}". Added to your adaptive schedule.`);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Daily Growth Guided Experience */}
      {activeTab === 'daily-growth' && (
        <div>
          {dailyStep === 1 && (
            <DailyGrowthStep
              currentStep={1}
              totalSteps={4}
              title="What happened today?"
              subtitle="Review your observed actions versus what you planned this morning."
              onNext={() => setDailyStep(2)}
            >
              <div className="p-4 bg-[#FAF8F5] dark:bg-[#12141A] rounded-lg border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] flex flex-col gap-2 text-sm text-[#495057] dark:text-[#CED4DA]">
                <p><strong>3 of 4 planned commitments completed:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>✓ Completed 45-minute morning cardio run (Health)</li>
                  <li>✓ Completed core architecture documentation (Career)</li>
                  <li>✓ 20-minute evening mindfulness reflection (Mind)</li>
                  <li>✕ Skipped: Secondary inbox clearing block</li>
                </ul>
              </div>
            </DailyGrowthStep>
          )}

          {dailyStep === 2 && (
            <DailyGrowthStep
              currentStep={2}
              totalSteps={4}
              title="What pattern appeared?"
              subtitle="The intelligence engine noticed an observable rhythm in your execution."
              onPrevious={() => setDailyStep(1)}
              onNext={() => setDailyStep(3)}
            >
              <div className="p-4 bg-[rgba(91,94,166,0.06)] dark:bg-[rgba(129,140,248,0.08)] rounded-lg border border-[rgba(91,94,166,0.14)] text-xs text-[#4D5091] dark:text-[#818CF8] leading-relaxed">
                <strong className="block font-semibold mb-1 text-sm">Signal Observation:</strong>
                Your highest quality deep work occurs when preceded by morning movement. When movement was completed by 8:30 AM, task completion probability increased by 38%.
              </div>
            </DailyGrowthStep>
          )}

          {dailyStep === 3 && (
            <DailyGrowthStep
              currentStep={3}
              totalSteps={4}
              title="What is your evening reflection?"
              subtitle="Capture a grounded reflection to integrate today's learnings into memory."
              onPrevious={() => setDailyStep(2)}
              onNext={() => setDailyStep(4)}
            >
              <textarea
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                placeholder="What was meaningful today? What friction can we eliminate tomorrow?"
                rows={4}
                className="w-full p-3.5 text-sm bg-white dark:bg-[#16191F] text-[#0F1115] dark:text-[#FAF8F5] border border-[rgba(15,17,21,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D5091] placeholder:text-[#868E96]"
              />
            </DailyGrowthStep>
          )}

          {dailyStep === 4 && (
            <DailyGrowthStep
              currentStep={4}
              totalSteps={4}
              title="Tomorrow's Rhythm Calibrated"
              subtitle="Your schedule has been aligned with your capacity and recovery requirements."
              onPrevious={() => setDailyStep(3)}
              nextLabel="Finish Daily Growth"
              onNext={() => {
                alert('Daily Growth completed and saved to your behavior history.');
                setActiveTab('overview');
                setDailyStep(1);
              }}
            >
              <div className="flex flex-col items-center justify-center text-center p-6 bg-[#FAF8F5] dark:bg-[#12141A] rounded-lg border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                <span className="text-3xl mb-2">🌿</span>
                <h4 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
                  Reflection Complete
                </h4>
                <p className="text-xs text-[#868E96] mt-1 max-w-sm">
                  Rest well tonight. Tomorrow begins with calm clarity at your preferred waking rhythm.
                </p>
              </div>
            </DailyGrowthStep>
          )}
        </div>
      )}
    </div>
  );
}
