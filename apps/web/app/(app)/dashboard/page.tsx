'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface DailyGrowthData {
  date: string;
  futureSelf: {
    identityStatement: string;
    horizonYears: number;
    desiredStates: string[];
    values: string[];
    lifeAreaTargets?: Record<string, string>;
  } | null;
  alignmentScore: number;
  checkin: {
    id: string;
    dayRating: number;
    reflection?: string;
    createdAt: string;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    lifeArea?: { id: string; name: string; color: string };
  }>;
  routines: Array<{
    id: string;
    title: string;
    frequency: string;
    targetStreak: number;
    currentStreak: number;
    completedToday?: boolean;
    lifeArea?: { id: string; name: string; color: string };
  }>;
  stats: {
    tasksTotal: number;
    tasksCompleted: number;
    routinesTotal: number;
    routinesCompletedToday: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DailyGrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check-in form state
  const [checkinRating, setCheckinRating] = useState<number>(5);
  const [checkinReflection, setCheckinReflection] = useState<string>('');
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);

  // New task quick-add state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await apiClient.get<DailyGrowthData>('/daily-growth/today');
      if (res.ok) {
        setData(res.data);
      } else {
        setError(res.error.error.message || 'Failed to load dashboard data.');
      }
    } catch {
      setError('An error occurred while fetching dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Session timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionActive) {
      timer = setInterval(() => {
        setSessionSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionActive]);

  async function handleCheckinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCheckinSubmitting(true);
    const res = await apiClient.post('/daily-growth/checkin', {
      dayRating: checkinRating,
      reflection: checkinReflection.trim() || undefined,
    });
    setCheckinSubmitting(false);
    if (res.ok) {
      await fetchDashboardData();
    }
  }

  async function handleTaskComplete(taskId: string) {
    const res = await apiClient.post(`/tasks/${taskId}/complete`);
    if (res.ok) {
      await fetchDashboardData();
    }
  }

  async function handleTaskSkip(taskId: string) {
    const res = await apiClient.post(`/tasks/${taskId}/skip`);
    if (res.ok) {
      await fetchDashboardData();
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTaskSubmitting(true);
    const res = await apiClient.post('/tasks', {
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      scheduledDate: new Date().toISOString().split('T')[0],
    });
    setTaskSubmitting(false);
    if (res.ok) {
      setNewTaskTitle('');
      await fetchDashboardData();
    }
  }

  async function handleRoutineComplete(routineId: string) {
    const res = await apiClient.post(`/routines/${routineId}/complete`);
    if (res.ok) {
      await fetchDashboardData();
    }
  }

  async function handleRoutineSkip(routineId: string) {
    const res = await apiClient.post(`/routines/${routineId}/skip`);
    if (res.ok) {
      await fetchDashboardData();
    }
  }

  async function handleStartSession() {
    setSessionSubmitting(true);
    await apiClient.post('/daily-growth/session/start');
    setSessionSubmitting(false);
    setSessionActive(true);
    setSessionSeconds(0);
  }

  async function handleCompleteSession() {
    setSessionSubmitting(true);
    await apiClient.post('/daily-growth/session/complete', {
      durationSeconds: Math.max(1, sessionSeconds),
      summary: 'Completed 5-min daily growth focus session.',
    });
    setSessionSubmitting(false);
    setSessionActive(false);
    await fetchDashboardData();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1.5rem', color: '#dc2626' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Unable to load dashboard</p>
        <p style={{ fontSize: '0.875rem' }}>{error}</p>
        <button onClick={() => { setLoading(true); fetchDashboardData(); }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const futureSelf = data?.futureSelf;
  const alignmentScore = data?.alignmentScore ?? 0;
  const tasks = data?.tasks ?? [];
  const routines = data?.routines ?? [];
  const stats = data?.stats ?? { tasksTotal: 0, tasksCompleted: 0, routinesTotal: 0, routinesCompletedToday: 0 };
  const checkin = data?.checkin;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
            Daily Growth Dashboard
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Alignment Score Badge */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Life Alignment
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: alignmentScore >= 70 ? '#16a34a' : '#6366f1' }}>
              {Math.round(alignmentScore)}%
            </div>
          </div>
          <div style={{ width: '60px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, alignmentScore))}%`,
                height: '100%',
                background: alignmentScore >= 70 ? '#16a34a' : '#6366f1',
                borderRadius: '3px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Future Self Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: '14px',
          padding: '1.75rem',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
        }}
      >
        {futureSelf ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>
                🌟 Future Self Vision ({futureSelf.horizonYears}-Year Horizon)
              </span>
              <Link href="/settings" style={{ fontSize: '0.8125rem', color: '#e0e7ff', textDecoration: 'underline' }}>
                Edit Vision
              </Link>
            </div>
            <p style={{ fontSize: '1.1875rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '1rem' }}>
              &ldquo;{futureSelf.identityStatement}&rdquo;
            </p>
            {futureSelf.values && futureSelf.values.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>Core Values:</span>
                {futureSelf.values.map((v) => (
                  <span
                    key={v}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>Define Your Future Self</h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Who do you want to become? Set your horizon and core values to guide all daily actions.
              </p>
            </div>
            <Link
              href="/settings"
              style={{
                background: '#ffffff',
                color: '#4f46e5',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Configure Future Self
            </Link>
          </div>
        )}
      </div>

      {/* Two Column Grid: Daily Session / Check-in & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Daily Growth Session Widget */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>🌱 Daily Growth Session</h2>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f3f4f6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              5 Minutes
            </span>
          </div>

          {sessionActive ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#6366f1', marginBottom: '0.5rem' }}>
                {Math.floor(sessionSeconds / 60)}:{String(sessionSeconds % 60).padStart(2, '0')}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                Focus on high-leverage actions and reflect on your alignment with your future self.
              </p>
              <button
                onClick={handleCompleteSession}
                disabled={sessionSubmitting}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {sessionSubmitting ? 'Recording...' : 'Finish Growth Session'}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                Take 5 dedicated minutes each morning to align your intention with your core life values.
              </p>
              <button
                onClick={handleStartSession}
                disabled={sessionSubmitting}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {sessionSubmitting ? 'Starting...' : 'Start Daily Growth Session'}
              </button>
            </div>
          )}
        </div>

        {/* Daily Check-in Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            📝 Daily Check-in
          </h2>

          {checkin ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Checked in today</span>
                <span style={{ fontSize: '0.875rem', color: '#15803d' }}>
                  (Rating: {checkin.dayRating} / 5 ⭐)
                </span>
              </div>
              {checkin.reflection && (
                <p style={{ fontSize: '0.875rem', color: '#374151', fontStyle: 'italic' }}>
                  &ldquo;{checkin.reflection}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleCheckinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                  How aligned did you feel today? (1 - 5)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCheckinRating(val)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0',
                        borderRadius: '6px',
                        border: checkinRating === val ? '2px solid #6366f1' : '1px solid #d1d5db',
                        background: checkinRating === val ? '#ede9fe' : '#ffffff',
                        fontWeight: checkinRating === val ? 700 : 500,
                        color: checkinRating === val ? '#4f46e5' : '#374151',
                        cursor: 'pointer',
                      }}
                    >
                      {val} ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.375rem' }}>
                  Quick Reflection (optional)
                </label>
                <input
                  type="text"
                  value={checkinReflection}
                  onChange={(e) => setCheckinReflection(e.target.value)}
                  placeholder="One win, insight, or adjustment..."
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={checkinSubmitting}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start' }}
              >
                {checkinSubmitting ? 'Saving...' : 'Save Check-in'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Today's Tasks Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              🎯 Today&apos;s Actions ({stats.tasksCompleted} / {stats.tasksTotal} completed)
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
              Actions moving you closer to your goals and future self.
            </p>
          </div>
          <Link href="/tasks" style={{ fontSize: '0.875rem', color: '#6366f1', fontWeight: 500 }}>
            View All Tasks →
          </Link>
        </div>

        {/* Quick Add Task */}
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add an actionable task for today..."
            className="form-input"
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            className="form-input"
            style={{ width: 'auto', minWidth: '110px' }}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <button type="submit" disabled={taskSubmitting || !newTaskTitle.trim()} className="btn btn-primary">
            {taskSubmitting ? 'Adding...' : '+ Add'}
          </button>
        </form>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
            No actions scheduled for today. Add one above to build momentum!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isSkipped = task.status === 'skipped';

              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    background: isCompleted ? '#f9fafb' : '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          task.priority === 'HIGH' ? '#fee2e2' : task.priority === 'MEDIUM' ? '#fef3c7' : '#e0e7ff',
                        color:
                          task.priority === 'HIGH' ? '#b91c1c' : task.priority === 'MEDIUM' ? '#92400e' : '#3730a3',
                      }}
                    >
                      {task.priority}
                    </span>

                    {task.lifeArea && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: `${task.lifeArea.color || '#6366f1'}18`,
                          color: task.lifeArea.color || '#6366f1',
                        }}
                      >
                        {task.lifeArea.name}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '0.9375rem',
                        color: isCompleted ? '#9ca3af' : '#111827',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        fontWeight: isCompleted ? 400 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isCompleted ? (
                      <span style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>Completed ✓</span>
                    ) : isSkipped ? (
                      <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Skipped</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleTaskComplete(task.id)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => handleTaskSkip(task.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', color: '#6b7280', borderColor: '#d1d5db' }}
                        >
                          Skip
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Habits & Routines */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.375rem' }}>
          ⚡ Daily Habits &amp; Routines ({stats.routinesCompletedToday} / {stats.routinesTotal} done)
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1.25rem' }}>
          Consistent micro-habits compound into your future self.
        </p>

        {routines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
            No routines configured yet. Create routines to automate your core daily habits.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
            {routines.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: r.completedToday ? '#f0fdf4' : '#ffffff',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827', marginBottom: '0.25rem' }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>🔥 Streak: {r.currentStreak} days</span>
                    <span>• Target: {r.targetStreak}</span>
                  </div>
                </div>

                <div>
                  {r.completedToday ? (
                    <span style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>Done ✓</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => handleRoutineComplete(r.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.3rem 0.625rem', fontSize: '0.75rem' }}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleRoutineSkip(r.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.625rem', fontSize: '0.75rem', color: '#6b7280', borderColor: '#d1d5db' }}
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
