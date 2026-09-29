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
import { EmptyState } from '@/components/ui/EmptyState';

interface GapItem {
  type: 'CONSISTENCY' | 'QUANTITY' | 'EXECUTION' | 'PRIORITY' | 'BALANCE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  observed: string;
  target: string;
  description: string;
  hypothesis?: string;
  experiment?: string;
}

interface SignalItem {
  score: number;
  direction: 'UP' | 'DOWN' | 'STABLE';
  summary: string;
}

interface LifeAreaStat {
  area: 'health' | 'career' | 'mind' | 'relationships';
  hours: number;
  score: number;
}

interface TodayTask {
  id: string;
  title: string;
  status: string;
  lifeArea?: { type?: string };
}

export default function GrowthPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'daily-growth'>('overview');
  const [dailyStep, setDailyStep] = useState(1);
  const [reflectionInput, setReflectionInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [signals, setSignals] = useState<{
    consistency?: SignalItem;
    momentum?: SignalItem;
    balance?: SignalItem;
  } | null>(null);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [lifeAreas, setLifeAreas] = useState<LifeAreaStat[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);

  const fetchGrowthData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [signalsRes, gapsRes, lifeAreasRes, tasksRes] = await Promise.all([
        apiClient.get<any>('/growth/signals'),
        apiClient.get<any>('/growth/gaps'),
        apiClient.get<any>('/growth/life-areas'),
        apiClient.get<any>('/tasks'),
      ]);

      if (signalsRes.ok && signalsRes.data) {
        setSignals(signalsRes.data);
      } else {
        setSignals(null);
      }

      if (gapsRes.ok && Array.isArray(gapsRes.data)) {
        setGaps(
          gapsRes.data.map((g: any) => ({
            type: g.type || 'CONSISTENCY',
            severity: g.severity || 'LOW',
            observed: g.observed || g.evidenceSummary || 'Observed execution shortfall',
            target: g.target || g.targetCommitment || 'Target commitment',
            description: g.description || g.explanation || '',
            hypothesis: g.hypothesis,
            experiment: g.experiment || g.recommendedMicroExperiment,
          }))
        );
      } else {
        setGaps([]);
      }

      if (lifeAreasRes.ok && Array.isArray(lifeAreasRes.data)) {
        setLifeAreas(lifeAreasRes.data);
      } else {
        setLifeAreas([]);
      }

      if (tasksRes.ok && Array.isArray(tasksRes.data)) {
        setTodayTasks(tasksRes.data);
      } else {
        setTodayTasks([]);
      }
    } catch {
      setSignals(null);
      setGaps([]);
      setLifeAreas([]);
      setTodayTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  const handleFinishDailyGrowth = async () => {
    setIsSubmittingCheckin(true);
    try {
      if (reflectionInput.trim()) {
        await apiClient.post('/daily-growth/checkin', {
          reflection: reflectionInput.trim(),
        });
      }
    } catch (err) {
      console.error('Failed to submit daily growth reflection', err);
    } finally {
      setIsSubmittingCheckin(false);
      setActiveTab('overview');
      setDailyStep(1);
    }
  };

  const completedTodayTasks = todayTasks.filter((t) => t.status === 'COMPLETED');

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
            {signals && (signals.consistency || signals.momentum || signals.balance) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {signals.consistency && (
                  <SignalIndicator
                    signalType="CONSISTENCY"
                    score={signals.consistency.score}
                    direction={signals.consistency.direction || 'STABLE'}
                    summary={signals.consistency.summary || 'Consistency across your daily routines.'}
                  />
                )}
                {signals.momentum && (
                  <SignalIndicator
                    signalType="MOMENTUM"
                    score={signals.momentum.score}
                    direction={signals.momentum.direction || 'STABLE'}
                    summary={signals.momentum.summary || 'Task completion velocity.'}
                  />
                )}
                {signals.balance && (
                  <SignalIndicator
                    signalType="BALANCE"
                    score={signals.balance.score}
                    direction={signals.balance.direction || 'STABLE'}
                    summary={signals.balance.summary || 'Equitable allocation across life areas.'}
                  />
                )}
              </div>
            ) : (
              <Card variant="subtle" padding="md">
                <p className="text-xs text-[#868E96] text-center py-4">
                  Evidence signals will populate here after you record consecutive daily habits and check-ins.
                </p>
              </Card>
            )}
          </div>

          {/* Life Area Balance Grid */}
          <Card variant="default" padding="lg">
            <h3 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] mb-2">
              Life Area Balance & Execution Distribution
            </h3>
            <p className="text-xs text-[#868E96] mb-5">
              Verified behavioral hours invested across life areas over the past rolling 30 days.
            </p>
            {lifeAreas.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {lifeAreas.map((item) => (
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
            ) : (
              <p className="text-xs text-[#868E96] italic">
                No life area distribution recorded yet. Categorized tasks and routines will accumulate here over rolling 30 days.
              </p>
            )}
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
          {gaps.length > 0 ? (
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
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active behavioral gaps"
              description="Your logged execution aligns with your stated goals and target commitments."
            />
          )}
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
                {todayTasks.length > 0 ? (
                  <>
                    <p>
                      <strong>
                        {completedTodayTasks.length} of {todayTasks.length} planned commitments completed:
                      </strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {todayTasks.map((t) => (
                        <li key={t.id}>
                          {t.status === 'COMPLETED' ? '✓' : '✕'} {t.title}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-[#868E96] italic">
                    No tasks were scheduled for today. You can still complete your evening reflection.
                  </p>
                )}
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
                {signals?.consistency ? (
                  <span>
                    Your current consistency is trending {signals.consistency.direction.toLowerCase()} with a score of {signals.consistency.score}/100.
                  </span>
                ) : (
                  <span>
                    Pattern recognition activates as you accumulate multiple consecutive days of logged activity and check-ins.
                  </span>
                )}
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
              nextLabel={isSubmittingCheckin ? 'Saving...' : 'Finish Daily Growth'}
              onNext={handleFinishDailyGrowth}
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
