'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { GrowthRing } from '@/components/domain/GrowthRing';
import { TaskRow } from '@/components/domain/TaskRow';
import { SignalIndicator } from '@/components/domain/SignalIndicator';
import { CompanionPulse } from '@/components/domain/CompanionPulse';

interface TodayTask {
  id: string;
  title: string;
  estimatedMinutes?: number;
  scheduledTime?: string;
  priority?: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  lifeArea?: any;
}

interface TodayState {
  greeting: string;
  dateString: string;
  energyLevel: 'high' | 'steady' | 'recovery';
  focusPriority: string;
  nextAction: TodayTask | null;
  tasks: TodayTask[];
  signals: {
    consistency: number;
    momentum: number;
    balance: number;
  } | null;
  dailyGrowthReady: boolean;
}

export default function TodayPage() {
  const [data, setData] = useState<TodayState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch daily growth summary or tasks
      const [growthRes, tasksRes] = await Promise.all([
        apiClient.get<any>('/daily-growth/today'),
        apiClient.get<any>('/tasks'),
      ]);

      const now = new Date();
      const hours = now.getHours();
      let greeting = 'Good morning';
      if (hours >= 12 && hours < 17) greeting = 'Good afternoon';
      else if (hours >= 17) greeting = 'Good evening';

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      const dateString = now.toLocaleDateString('en-US', options);

      // Parse tasks
      const tasksList = tasksRes.ok && Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const growthInfo = growthRes.ok ? (growthRes.data as any) : null;

      const allTasks: TodayTask[] = tasksList.map((t: any) => ({
        id: t.id,
        title: t.title,
        estimatedMinutes: t.estimatedMinutes || 30,
        scheduledTime: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        priority: t.priority || 1,
        status: t.status || 'TODO',
        lifeArea: t.lifeArea?.type || 'mind',
      }));

      // Sort pending tasks first
      const pendingTasks = allTasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS');
      const nextAction = pendingTasks[0] || null;

      setData({
        greeting,
        dateString,
        energyLevel: hours < 14 ? 'high' : hours < 19 ? 'steady' : 'recovery',
        focusPriority: nextAction ? nextAction.title : 'All critical tasks completed for today',
        nextAction,
        tasks: allTasks,
        signals: growthInfo?.signals || null,
        dailyGrowthReady: hours >= 17 || allTasks.filter((t) => t.status === 'COMPLETED').length >= 3,
      });
    } catch {
      setData({
        greeting: 'Welcome back',
        dateString: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        energyLevel: 'steady',
        focusPriority: 'Establish consistent daily focus',
        nextAction: null,
        tasks: [],
        signals: null,
        dailyGrowthReady: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiClient.post(`/tasks/${taskId}/complete`, {});
      // Optimistic update
      setData((prev) => {
        if (!prev) return null;
        const updated = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t
        );
        const next = updated.find((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS') || null;
        return { ...prev, tasks: updated, nextAction: next };
      });
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleSkipTask = async (taskId: string) => {
    try {
      await apiClient.post(`/tasks/${taskId}/skip`, {});
      setData((prev) => {
        if (!prev) return null;
        const updated = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'SKIPPED' as const } : t
        );
        const next = updated.find((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS') || null;
        return { ...prev, tasks: updated, nextAction: next };
      });
    } catch (err) {
      console.error('Failed to skip task:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2">
        <Skeleton height={40} width="40%" />
        <Skeleton height={140} variant="rectangular" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton height={120} variant="rectangular" />
          <Skeleton height={120} variant="rectangular" />
          <Skeleton height={120} variant="rectangular" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-12">
        <ErrorState message={error || 'Unable to load today’s schedule'} onRetry={fetchTodayData} />
      </div>
    );
  }

  const completedCount = data.tasks.filter((t) => t.status === 'COMPLETED').length;
  const totalCount = data.tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* 1. Spatial Greeting & Time Horizon */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#868E96] font-semibold block mb-1">
            {data.dateString}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
            {data.greeting}.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={data.energyLevel === 'high' ? 'growth' : data.energyLevel === 'steady' ? 'energy' : 'recovery'}>
            {data.energyLevel} energy rhythm
          </Badge>
          <Link href="/companion" className="flex items-center gap-2 group text-xs text-[#868E96] hover:text-[#0F1115] dark:hover:text-[#FAF8F5] transition-colors">
            <CompanionPulse state="idle" size={26} />
            <span className="hidden sm:inline">Companion ready</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Focal Priority Card (What matters now?) */}
      <Card variant="elevated" padding="lg" className="border-l-4 border-l-[#226949] dark:border-l-[#4ADE80]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#226949] dark:text-[#4ADE80] block mb-1.5">
              Current Focal Priority
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] leading-snug">
              {data.focusPriority}
            </h2>
            {data.nextAction && (
              <p className="text-xs text-[#868E96] mt-2 flex items-center gap-2">
                <span>Scheduled for: {data.nextAction.scheduledTime || 'Today'}</span>
                <span>•</span>
                <span>Estimated duration: {data.nextAction.estimatedMinutes}m</span>
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {data.nextAction && (
              <Button
                variant="growth"
                size="md"
                onClick={() => handleCompleteTask(data.nextAction!.id)}
              >
                Complete Action
              </Button>
            )}
            <Button variant="secondary" size="md" href="/plan">
              Open Planner
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Narrative Layout: Execution Plan vs Progress & Growth Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 spans): Today's Plan */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
                Today’s Plan
              </h3>
              <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-[#EFECE4] dark:bg-[#272C37] text-[#495057] dark:text-[#CED4DA]">
                {completedCount} / {totalCount}
              </span>
            </div>
            <Link href="/plan" className="text-xs font-medium text-[#4D5091] dark:text-[#818CF8] hover:underline">
              Adjust Schedule →
            </Link>
          </div>

          {data.tasks.length === 0 ? (
            <EmptyState
              title="No commitments scheduled for today"
              description="Your schedule is completely clear. You can review your goals or add a deliberate task in the planner."
              actionLabel="Add a Task"
              onAction={() => (window.location.href = '/plan')}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  estimatedMinutes={task.estimatedMinutes}
                  scheduledTime={task.scheduledTime}
                  status={task.status}
                  lifeArea={task.lifeArea}
                  onComplete={handleCompleteTask}
                  onSkip={handleSkipTask}
                  onReschedule={() => (window.location.href = '/plan')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Execution Progress & Daily Growth Entry */}
        <div className="flex flex-col gap-6">
          {/* Progress Ring Card */}
          <Card variant="default" padding="md" className="flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#868E96] mb-4">
              Execution Velocity
            </span>
            <GrowthRing progress={progressPercent} label="Completed" size={130} />
            <p className="text-xs text-[#868E96] mt-4 max-w-[200px] leading-relaxed">
              {progressPercent === 100
                ? 'All scheduled actions finished. Rest and integrate.'
                : `${totalCount - completedCount} actions remaining before evening reflection.`}
            </p>
          </Card>

          {/* Daily Growth Evening Review Trigger */}
          <Card
            variant="default"
            padding="md"
            className="border-t-4 border-t-[#4D5091] dark:border-t-[#818CF8] flex flex-col gap-3"
          >
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#4D5091] dark:text-[#818CF8] block mb-1">
                Evening Reflection
              </span>
              <h4 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
                Daily Growth Sequence
              </h4>
              <p className="text-xs text-[#868E96] mt-1 leading-relaxed">
                Reflect on patterns, close behavioral gaps, and calmly prepare tomorrow’s rhythm.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              href="/growth"
              className="w-full mt-1"
            >
              Begin Reflection
            </Button>
          </Card>
        </div>
      </div>

      {/* 4. Three Distinctive Signals (Consistency, Momentum, Balance) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
            Growth Intelligence Signals
          </h3>
          <Link href="/growth" className="text-xs font-medium text-[#4D5091] dark:text-[#818CF8] hover:underline">
            View full analytics →
          </Link>
        </div>
        {data.signals ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SignalIndicator
              signalType="CONSISTENCY"
              score={data.signals.consistency}
              direction="STABLE"
              summary="Regularity across your daily commitments."
            />
            <SignalIndicator
              signalType="MOMENTUM"
              score={data.signals.momentum}
              direction="STABLE"
              summary="Habit execution velocity over rolling 14 days."
            />
            <SignalIndicator
              signalType="BALANCE"
              score={data.signals.balance}
              direction="STABLE"
              summary="Distribution across deliberate life areas."
            />
          </div>
        ) : (
          <Card variant="subtle" padding="md">
            <p className="text-xs text-[#868E96] text-center py-4">
              Growth signals will generate here once you begin completing scheduled actions and logging check-ins.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
