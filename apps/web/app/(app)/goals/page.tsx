'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface LifeArea {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

interface GoalMetric {
  id: string;
  metricName: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  priority: string;
  targetDate?: string;
  lifeAreaId: string;
  lifeArea?: LifeArea;
  metrics: GoalMetric[];
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedLifeArea, setSelectedLifeArea] = useState<string>('all');

  // New Goal modal/form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLifeAreaId, setNewLifeAreaId] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  // Metric fields
  const [metricName, setMetricName] = useState('');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  const [currentValue, setCurrentValue] = useState<number | ''>(0);
  const [unit, setUnit] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [areasRes, goalsRes] = await Promise.all([
        apiClient.get<LifeArea[]>('/life-areas'),
        apiClient.get<Goal[]>(`/goals?status=${selectedStatus}`),
      ]);

      if (areasRes.ok) {
        setLifeAreas(areasRes.data);
        if (areasRes.data.length > 0 && !newLifeAreaId) {
          setNewLifeAreaId(areasRes.data[0].id);
        }
      }

      if (goalsRes.ok) {
        setGoals(goalsRes.data);
      } else {
        setError(goalsRes.error.error.message || 'Failed to load goals.');
      }
    } catch {
      setError('An error occurred while loading goals.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, newLifeAreaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newLifeAreaId) return;

    setSubmitting(true);
    const metricsPayload =
      metricName && targetValue !== ''
        ? [
            {
              metricName: metricName.trim(),
              startValue: 0,
              targetValue: Number(targetValue),
              currentValue: currentValue !== '' ? Number(currentValue) : 0,
              unit: unit.trim() || 'units',
            },
          ]
        : [];

    const res = await apiClient.post('/goals', {
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      lifeAreaId: newLifeAreaId,
      targetDate: newTargetDate || undefined,
      priority: newPriority,
      metrics: metricsPayload,
    });

    setSubmitting(false);
    if (res.ok) {
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewTargetDate('');
      setMetricName('');
      setTargetValue('');
      setCurrentValue(0);
      setUnit('');
      await fetchData();
    }
  }

  async function handleArchiveGoal(goalId: string) {
    if (!confirm('Are you sure you want to archive this goal?')) return;
    const res = await apiClient.post(`/goals/${goalId}/archive`);
    if (res.ok) {
      await fetchData();
    }
  }

  async function handleCompleteGoal(goalId: string) {
    const res = await apiClient.patch(`/goals/${goalId}`, {
      status: 'completed',
    });
    if (res.ok) {
      await fetchData();
    }
  }

  const filteredGoals = goals.filter((g) => {
    if (selectedLifeArea !== 'all' && g.lifeAreaId !== selectedLifeArea) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
            Life Goals &amp; Outcomes
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            Measurable, high-leverage goals aligned with your core life areas.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          + Create New Goal
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem', background: '#e5e7eb', padding: '0.25rem', borderRadius: '8px' }}>
          {(['active', 'completed', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              style={{
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedStatus === st ? '#ffffff' : 'transparent',
                color: selectedStatus === st ? '#111827' : '#6b7280',
                boxShadow: selectedStatus === st ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={selectedLifeArea}
          onChange={(e) => setSelectedLifeArea(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: '160px', padding: '0.4rem 0.75rem' }}
        >
          <option value="all">All Life Areas</option>
          {lifeAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.25rem', borderRadius: '8px', color: '#dc2626' }}>
          {error}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div style={{ background: '#fff', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
            No {selectedStatus} goals found
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Create your first goal to represent the outcomes that define your future self.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Define a Goal
          </button>
        </div>
      ) : (
        /* Goals Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredGoals.map((goal) => {
            const metric = goal.metrics?.[0];
            const percent = metric && metric.targetValue > 0
              ? Math.min(100, Math.round((metric.currentValue / metric.targetValue) * 100))
              : 0;

            return (
              <div
                key={goal.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  {/* Top tags */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    {goal.lifeArea && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          background: `${goal.lifeArea.color || '#6366f1'}15`,
                          color: goal.lifeArea.color || '#6366f1',
                        }}
                      >
                        {goal.lifeArea.name}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background:
                          goal.priority === 'HIGH' ? '#fee2e2' : goal.priority === 'MEDIUM' ? '#fef3c7' : '#e0e7ff',
                        color:
                          goal.priority === 'HIGH' ? '#b91c1c' : goal.priority === 'MEDIUM' ? '#92400e' : '#3730a3',
                      }}
                    >
                      {goal.priority}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {goal.description}
                    </p>
                  )}

                  {/* Metric Progress */}
                  {metric && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
                        <span style={{ fontWeight: 500, color: '#374151' }}>{metric.metricName}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {metric.currentValue} / {metric.targetValue} {metric.unit}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: percent >= 100 ? '#16a34a' : '#6366f1',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {goal.targetDate && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                  {goal.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleCompleteGoal(goal.id)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8125rem' }}
                      >
                        Mark Done
                      </button>
                      <button
                        onClick={() => handleArchiveGoal(goal.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          padding: '0.35rem 0.5rem',
                        }}
                      >
                        Archive
                      </button>
                    </>
                  )}
                  {goal.status === 'completed' && (
                    <span style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>Completed ✓</span>
                  )}
                  {goal.status === 'archived' && (
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Archived</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.75rem',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Create New Goal</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Run a Half Marathon, Publish Book"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Life Area *</label>
                <select
                  value={newLifeAreaId}
                  onChange={(e) => setNewLifeAreaId(e.target.value)}
                  className="form-input"
                  required
                >
                  {lifeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Why does this goal matter to your future self?"
                  rows={2}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Date</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="form-input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Optional Key Metric */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                  Target Metric (Optional)
                </h4>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Metric Name</label>
                  <input
                    type="text"
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    placeholder="e.g., Distance run, Chapters written, Savings"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Current</label>
                    <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target</label>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="km, books, $"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Creating...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
