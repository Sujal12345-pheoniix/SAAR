'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { GoalProgress } from '@/components/domain/GoalProgress';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LifeAreaType } from '@/components/domain/LifeAreaIndicator';

interface GoalItem {
  id: string;
  title: string;
  lifeArea: LifeAreaType;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
  whyStatement: string;
  nextAction: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArea, setNewArea] = useState<LifeAreaType>('health');
  const [newTarget, setNewTarget] = useState('10');
  const [newUnit, setNewUnit] = useState('km');
  const [newWhy, setNewWhy] = useState('');

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/goals');
      if (res.ok && Array.isArray(res.data)) {
        setGoals(
          res.data.map((g: any) => ({
            id: g.id,
            title: g.title,
            lifeArea: (g.lifeArea?.type || 'health') as LifeAreaType,
            currentValue: g.currentValue || 0,
            targetValue: g.targetValue || 100,
            unit: g.unit || '%',
            trend: g.trend || 'stable',
            whyStatement: g.whyStatement || 'Cultivating intentional mastery in this area.',
            nextAction: g.nextAction || 'Schedule next milestone session',
          }))
        );
      } else {
        setGoals([]);
      }
    } catch {
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await apiClient.post('/goals', {
        title: newTitle.trim(),
        targetValue: parseFloat(newTarget) || 100,
        unit: newUnit,
        whyStatement: newWhy,
      });
      setIsModalOpen(false);
      setNewTitle('');
      fetchGoals();
    } catch {
      const created: GoalItem = {
        id: `g-local-${Date.now()}`,
        title: newTitle.trim(),
        lifeArea: newArea,
        currentValue: 0,
        targetValue: parseFloat(newTarget) || 100,
        unit: newUnit,
        trend: 'stable',
        whyStatement: newWhy,
        nextAction: 'Schedule first deliberate task',
      };
      setGoals((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewTitle('');
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#868E96] font-semibold block mb-1">
            Destinations & Progress
          </span>
          <h1 className="text-3xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
            Goals.
          </h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          + Define New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height={180} variant="rectangular" />
          <Skeleton height={180} variant="rectangular" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="No goals defined yet"
          description="A goal in SAAR is not a detached wish—it is a concrete destination with a clear reason why and connected daily habits."
          actionLabel="Define Your First Destination"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((goal) => (
            <GoalProgress
              key={goal.id}
              id={goal.id}
              title={goal.title}
              lifeArea={goal.lifeArea}
              currentValue={goal.currentValue}
              targetValue={goal.targetValue}
              unit={goal.unit}
              trend={goal.trend}
              whyStatement={goal.whyStatement}
              nextAction={goal.nextAction}
            />
          ))}
        </div>
      )}

      {/* Goal Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Define Meaningful Destination"
        description="Connect your aspiration with an explicit metric and purpose."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="growth" size="sm" onClick={handleCreateGoal}>
              Create Goal
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
          <Input
            label="Goal Destination"
            placeholder="e.g., Run a 10K Sub-50 Minutes"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Metric"
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              required
            />
            <Input
              label="Unit"
              placeholder="e.g., km, books, hours"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              required
            />
          </div>
          <Input
            label="Why this matters (Intention Statement)"
            placeholder="Why is achieving this essential to who you are becoming?"
            value={newWhy}
            onChange={(e) => setNewWhy(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
