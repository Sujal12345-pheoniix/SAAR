'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface LifeArea {
  id: string;
  name: string;
  color: string;
}

interface Goal {
  id: string;
  title: string;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  scheduledDate?: string;
  lifeAreaId?: string;
  goalId?: string;
  lifeArea?: LifeArea;
  goal?: Goal;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [lifeAreaFilter, setLifeAreaFilter] = useState<string>('all');

  // Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLifeAreaId, setNewLifeAreaId] = useState('');
  const [newGoalId, setNewGoalId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  // Reschedule State
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, areasRes, goalsRes] = await Promise.all([
        apiClient.get<TaskItem[]>('/tasks'),
        apiClient.get<LifeArea[]>('/life-areas'),
        apiClient.get<Goal[]>('/goals'),
      ]);

      if (tasksRes.ok) {
        setTasks(tasksRes.data);
      } else {
        setError(tasksRes.error.error.message || 'Failed to load tasks.');
      }

      if (areasRes.ok) setLifeAreas(areasRes.data);
      if (goalsRes.ok) setGoals(goalsRes.data);
    } catch {
      setError('An error occurred while loading tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    const res = await apiClient.post('/tasks', {
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      lifeAreaId: newLifeAreaId || undefined,
      goalId: newGoalId || undefined,
      dueDate: newDueDate || undefined,
      scheduledDate: newDueDate || new Date().toISOString().split('T')[0],
      priority: newPriority,
    });

    setSubmitting(false);
    if (res.ok) {
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setNewLifeAreaId('');
      setNewGoalId('');
      await fetchData();
    }
  }

  async function handleCompleteTask(taskId: string) {
    const res = await apiClient.post(`/tasks/${taskId}/complete`);
    if (res.ok) {
      await fetchData();
    }
  }

  async function handleSkipTask(taskId: string) {
    const res = await apiClient.post(`/tasks/${taskId}/skip`);
    if (res.ok) {
      await fetchData();
    }
  }

  async function handleReschedule(taskId: string) {
    if (!rescheduleDate) return;
    const res = await apiClient.post(`/tasks/${taskId}/reschedule`, {
      newDate: rescheduleDate,
    });
    if (res.ok) {
      setRescheduleTaskId(null);
      setRescheduleDate('');
      await fetchData();
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (lifeAreaFilter !== 'all' && t.lifeAreaId !== lifeAreaFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
            Actionable Tasks
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            The daily micro-steps that propel your long-term life vision.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          + Create Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem', background: '#e5e7eb', padding: '0.25rem', borderRadius: '8px' }}>
          {(['all', 'pending', 'in_progress', 'completed', 'skipped'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === st ? '#ffffff' : 'transparent',
                color: statusFilter === st ? '#111827' : '#6b7280',
                boxShadow: statusFilter === st ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <select
          value={lifeAreaFilter}
          onChange={(e) => setLifeAreaFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: '150px', padding: '0.4rem 0.75rem' }}
        >
          <option value="all">All Life Areas</option>
          {lifeAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: '130px', padding: '0.4rem 0.75rem' }}
        >
          <option value="all">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
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
      ) : filteredTasks.length === 0 ? (
        <div style={{ background: '#fff', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
            No tasks found
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
            Capture a new action to stay on top of your daily execution.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Add a Task
          </button>
        </div>
      ) : (
        /* Task Cards List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isSkipped = task.status === 'skipped';
            const isPending = task.status === 'pending' || task.status === 'in_progress';

            return (
              <div
                key={task.id}
                style={{
                  background: isCompleted ? '#f9fafb' : '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '1.125rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background:
                          task.priority === 'HIGH' ? '#fee2e2' : task.priority === 'MEDIUM' ? '#fef3c7' : '#e0e7ff',
                        color:
                          task.priority === 'HIGH' ? '#b91c1c' : task.priority === 'MEDIUM' ? '#92400e' : '#3730a3',
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: isCompleted ? '#9ca3af' : '#111827',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>

                      {task.lifeArea && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.5rem',
                            borderRadius: '4px',
                            background: `${task.lifeArea.color || '#6366f1'}15`,
                            color: task.lifeArea.color || '#6366f1',
                          }}
                        >
                          {task.lifeArea.name}
                        </span>
                      )}

                      {task.goal && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            padding: '0.1rem 0.5rem',
                            borderRadius: '4px',
                            background: '#f3f4f6',
                            color: '#4b5563',
                          }}
                        >
                          🎯 {task.goal.title}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {task.description}
                      </p>
                    )}

                    {task.dueDate && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.35rem' }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                      >
                        Complete
                      </button>

                      <button
                        onClick={() => handleSkipTask(task.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', color: '#6b7280', borderColor: '#d1d5db' }}
                      >
                        Skip
                      </button>

                      <button
                        onClick={() => {
                          setRescheduleTaskId(task.id);
                          setRescheduleDate(new Date().toISOString().split('T')[0]);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6366f1',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          padding: '0.35rem 0.5rem',
                        }}
                      >
                        Reschedule
                      </button>
                    </>
                  )}

                  {isCompleted && (
                    <span style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>Completed ✓</span>
                  )}

                  {isSkipped && (
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Skipped</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTaskId && (
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
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', maxWidth: '380px', width: '100%' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Reschedule Task
            </h3>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Select New Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRescheduleTaskId(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReschedule(rescheduleTaskId)}
                className="btn btn-primary"
              >
                Update Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
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
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Create New Task</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Notes, link, or context..."
                  rows={2}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Life Area</label>
                  <select
                    value={newLifeAreaId}
                    onChange={(e) => setNewLifeAreaId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">None</option>
                    {lifeAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Goal (Optional)</label>
                  <select
                    value={newGoalId}
                    onChange={(e) => setNewGoalId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">None</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="form-input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
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
                  {submitting ? 'Creating...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
