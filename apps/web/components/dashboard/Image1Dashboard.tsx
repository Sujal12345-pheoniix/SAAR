'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Check,
  Calendar,
  TrendingUp,
  Activity,
  Target,
  Compass,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface TaskItem {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  estimatedMinutes?: number;
  scheduledTime?: string;
  priority?: number;
}

export function Image1Dashboard() {
  const [userName, setUserName] = useState<string>('Jacob');
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Deep Work Focus Block (90m)', status: 'COMPLETED', estimatedMinutes: 90, scheduledTime: '09:00 AM' },
    { id: '2', title: 'Hydration & Sunlight Protocol', status: 'COMPLETED', estimatedMinutes: 15, scheduledTime: '11:30 AM' },
    { id: '3', title: 'Physical Training & Mobility', status: 'TODO', estimatedMinutes: 45, scheduledTime: '04:30 PM' },
    { id: '4', title: 'Evening Retrospective & Planning', status: 'TODO', estimatedMinutes: 20, scheduledTime: '08:00 PM' },
  ]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const [userRes, tasksRes] = await Promise.all([
          apiClient.get<any>('/users/me'),
          apiClient.get<any>('/tasks'),
        ]);

        if (userRes.ok && userRes.data) {
          const name = userRes.data.displayName || userRes.data.email?.split('@')[0] || 'Jacob';
          setUserName(name);
        }

        if (tasksRes.ok && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
          setTasks(tasksRes.data.slice(0, 5));
        }
      } catch {
        // Fallback default tasks
      }
    }

    fetchUser();
  }, []);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-6">
      {/* Welcome Header — Clean Navy & White */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Personal Growth Intelligence &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Signal: Established
          </span>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>New Action</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Metrics Row — Fixed Padding, Clear Margins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Focus Time</span>
            <Clock size={16} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">2h 15m</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Target: 2h 30m daily</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Habit Adherence</span>
            <Target size={16} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">80%</div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">+8% from 30d baseline</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Energy & Clarity</span>
            <Activity size={16} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">8 / 10</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Optimal focus band</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Streak</span>
            <Calendar size={16} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">14 Days</div>
            <div className="text-xs text-blue-900 mt-1 font-semibold">1-day grace active</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tasks (Left 7 Cols) & Weekly Consistency (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Today's Habits & Actions (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Today&rsquo;s Habits & Actions
              </h2>
              <span className="text-xs text-slate-500">
                {completedCount} of {tasks.length} completed
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Click checkbox to toggle
            </span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const isDone = task.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        isDone
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {isDone && <Check size={14} />}
                    </div>
                    <span className={`text-sm font-semibold ${isDone ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.scheduledTime && (
                      <span className="text-xs text-slate-400 font-medium">
                        {task.scheduledTime}
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {task.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Consistency & Life Domain Balance (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Consistency Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                7-Day Consistency
              </h3>
              <span className="text-xs font-semibold text-emerald-600">
                85% Avg
              </span>
            </div>

            <div className="flex items-end justify-between gap-3 h-36 px-2">
              {[
                { day: 'Mon', height: '70%', isHigh: false },
                { day: 'Tue', height: '90%', isHigh: true },
                { day: 'Wed', height: '80%', isHigh: false },
                { day: 'Thu', height: '65%', isHigh: false },
                { day: 'Fri', height: '85%', isHigh: false },
                { day: 'Sat', height: '60%', isHigh: false },
                { day: 'Sun', height: '75%', isHigh: false },
              ].map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    style={{ height: bar.height }}
                    className={`w-full max-w-[28px] rounded-lg transition-all ${
                      bar.isHigh ? 'bg-slate-900 shadow-sm' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-slate-500">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Life Area Equilibrium */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Life Domain Balance
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Optimal
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Craft & Career</span>
                  <span>40%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full w-[40%] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Health & Body</span>
                  <span>30%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-700 h-full w-[30%] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Mind & Reflection</span>
                  <span>20%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full w-[20%] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Relationships</span>
                  <span>10%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full w-[10%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
