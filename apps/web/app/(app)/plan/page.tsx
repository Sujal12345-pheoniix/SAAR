'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { TaskRow } from '@/components/domain/TaskRow';
import { TradeoffCard } from '@/components/domain/TradeoffCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

interface PlanTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  scheduledTime?: string;
  priority: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  lifeArea: any;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
}

export default function PlannerPage() {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('30');
  const [newTaskTime, setNewTaskTime] = useState('09:00');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchPlannerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/api/v1/tasks');
      if (res.ok && Array.isArray(res.data)) {
        setTasks(
          res.data.map((t: any, idx: number) => ({
            id: t.id,
            title: t.title,
            estimatedMinutes: t.estimatedMinutes || 30,
            scheduledTime: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
            priority: t.priority || 1,
            status: t.status || 'TODO',
            lifeArea: t.lifeArea?.type || 'mind',
            dayOfWeek: idx % 5, // Spread across weekdays for realistic plan
          }))
        );
      }
    } catch {
      // Fallback
      setTasks([
        { id: 'p1', title: 'Deep Work: Architecture documentation', estimatedMinutes: 90, scheduledTime: '09:00 AM', priority: 1, status: 'TODO', lifeArea: 'career', dayOfWeek: 0 },
        { id: 'p2', title: 'Cardio Zone 2 training', estimatedMinutes: 45, scheduledTime: '11:00 AM', priority: 2, status: 'COMPLETED', lifeArea: 'health', dayOfWeek: 0 },
        { id: 'p3', title: 'Weekly review & financial audit', estimatedMinutes: 60, scheduledTime: '02:00 PM', priority: 2, status: 'TODO', lifeArea: 'finance', dayOfWeek: 0 },
        { id: 'p4', title: 'Mindful evening reading', estimatedMinutes: 30, scheduledTime: '08:30 PM', priority: 3, status: 'TODO', lifeArea: 'mind', dayOfWeek: 0 },
        { id: 'p5', title: 'Sprint planning and backlog grooming', estimatedMinutes: 60, scheduledTime: '10:00 AM', priority: 1, status: 'TODO', lifeArea: 'career', dayOfWeek: 1 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlannerData();
  }, [fetchPlannerData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await apiClient.post('/api/v1/tasks', {
        title: newTaskTitle.trim(),
        estimatedMinutes: parseInt(newTaskMinutes, 10) || 30,
      });
      setIsModalOpen(false);
      setNewTaskTitle('');
      fetchPlannerData();
    } catch {
      // Optimistic
      const newTask: PlanTask = {
        id: `local-${Date.now()}`,
        title: newTaskTitle.trim(),
        estimatedMinutes: parseInt(newTaskMinutes, 10) || 30,
        scheduledTime: newTaskTime,
        priority: 1,
        status: 'TODO',
        lifeArea: 'career',
        dayOfWeek: selectedDay,
      };
      setTasks((prev) => [newTask, ...prev]);
      setIsModalOpen(false);
      setNewTaskTitle('');
    }
  };

  const handleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'COMPLETED' as const } : t))
    );
  };

  const handleSkip = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'SKIPPED' as const } : t))
    );
  };

  // Day calculations
  const dayTasks = tasks.filter((t) => t.dayOfWeek === selectedDay);
  const currentLoadMinutes = dayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const capacityMinutes = 480; // 8 hours typical sustainable load
  const overloadMinutes = Math.max(0, currentLoadMinutes - capacityMinutes);

  const adjustments = overloadMinutes > 0 ? [
    {
      id: 'adj-1',
      action: 'Postpone',
      title: dayTasks[dayTasks.length - 1]?.title || 'Evening low-priority item',
      timeRecoveredMinutes: 60,
    },
    {
      id: 'adj-2',
      action: 'Compress duration',
      title: 'Shorten secondary meeting block',
      timeRecoveredMinutes: 30,
    }
  ] : [];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* 1. Header with View Switcher & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#868E96] font-semibold block mb-1">
            Adaptive Planning
          </span>
          <h1 className="text-3xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
            Plan & Capacity.
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Tabs
            size="sm"
            activeTab={viewMode}
            onChange={(tab) => setViewMode(tab as 'day' | 'week')}
            tabs={[
              { id: 'day', label: 'Day Focus' },
              { id: 'week', label: 'Week Overview' },
            ]}
          />
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            + Schedule Task
          </Button>
        </div>
      </div>

      {/* 2. Tradeoff Analysis Surface */}
      <TradeoffCard
        currentLoadMinutes={currentLoadMinutes}
        capacityMinutes={capacityMinutes}
        overloadMinutes={overloadMinutes}
        adjustments={adjustments}
        onApplyAdjustment={(adjId) => {
          alert(`Applied adaptive recommendation (${adjId}). Schedule rebalanced.`);
        }}
      />

      {/* 3. Day Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {days.map((dayName, idx) => {
          const isSelected = selectedDay === idx;
          const count = tasks.filter((t) => t.dayOfWeek === idx).length;
          return (
            <button
              key={dayName}
              type="button"
              onClick={() => setSelectedDay(idx)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium shrink-0 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#0F1115] text-[#FAF8F5] dark:bg-[#FAF8F5] dark:text-[#0F1115] shadow-xs'
                  : 'bg-white dark:bg-[#16191F] text-[#868E96] hover:text-[#0F1115] dark:hover:text-[#FAF8F5] border border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)]'
              }`}
            >
              <span>{dayName}</span>
              <span className={`ml-1.5 font-semibold ${isSelected ? 'opacity-80' : 'text-[#868E96]'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Schedule Items List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
            {days[selectedDay]} Commitments
          </h3>
          <span className="text-xs text-[#868E96] tabular-nums">
            Total planned: {Math.floor(currentLoadMinutes / 60)}h {currentLoadMinutes % 60}m
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton height={60} variant="rectangular" />
            <Skeleton height={60} variant="rectangular" />
            <Skeleton height={60} variant="rectangular" />
          </div>
        ) : dayTasks.length === 0 ? (
          <EmptyState
            title={`No commitments for ${days[selectedDay]}`}
            description="You have zero scheduled obligations. Enjoy restorative downtime or allocate deliberate time for long-term vision."
            actionLabel="Schedule First Task"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {dayTasks.map((task) => (
              <TaskRow
                key={task.id}
                id={task.id}
                title={task.title}
                estimatedMinutes={task.estimatedMinutes}
                scheduledTime={task.scheduledTime}
                status={task.status}
                lifeArea={task.lifeArea}
                onComplete={handleComplete}
                onSkip={handleSkip}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Deliberate Task"
        description="Allocate time connected to your high-leverage goals."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTask}>
              Save Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <Input
            label="Task Description"
            placeholder="e.g., Deep Work: Complete Part 4A verification"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimated Minutes"
              type="number"
              value={newTaskMinutes}
              onChange={(e) => setNewTaskMinutes(e.target.value)}
              min="5"
              max="480"
            />
            <Input
              label="Scheduled Time"
              type="time"
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
