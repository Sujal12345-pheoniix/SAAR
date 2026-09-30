'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Smile,
  Heart,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  Menu,
  Check,
  Plus,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ChevronDown,
  BarChart3,
  Home,
  Grid,
  User,
  Zap,
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
  const [activeScreen, setActiveScreen] = useState<'tracker' | 'trends' | 'impacts'>('tracker');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1); // Default Tuesday (like in Image 1)
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [userName, setUserName] = useState<string>('Jacob');
  const [greeting, setGreeting] = useState<string>('Good Morning!');
  const [focusMinutes, setFocusMinutes] = useState<number>(135); // 2h 15m
  const [moodLevel, setMoodLevel] = useState<number>(7); // 7/10
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Day strip data matching Image 1
  const daysOfWeek = [
    { day: 'MON', date: '15', accent: 'bg-purple-100 text-purple-700' },
    { day: 'TUE', date: '16', accent: 'bg-rose-100 text-rose-700' },
    { day: 'WED', date: '17', accent: 'bg-amber-100 text-amber-800' },
    { day: 'THU', date: '18', accent: 'bg-emerald-100 text-emerald-800' },
    { day: 'FRI', date: '19', accent: 'bg-sky-100 text-sky-800' },
    { day: 'SAT', date: '20', accent: 'bg-purple-100 text-purple-700' },
    { day: 'SUN', date: '21', accent: 'bg-pink-100 text-pink-700' },
  ];

  useEffect(() => {
    // Time-aware greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning!');
    else if (hour < 18) setGreeting('Good Afternoon!');
    else setGreeting('Good Evening!');

    // Fetch user profile and real tasks
    async function fetchData() {
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
        } else {
          // Provide representative starter habits
          setTasks([
            { id: '1', title: 'Deep Work Focus Block', status: 'COMPLETED', estimatedMinutes: 60, scheduledTime: '09:00 AM' },
            { id: '2', title: 'Hydration & Electrolytes', status: 'COMPLETED', estimatedMinutes: 10, scheduledTime: '11:00 AM' },
            { id: '3', title: 'Cardio & Sunlight Exposure', status: 'TODO', estimatedMinutes: 45, scheduledTime: '04:30 PM' },
            { id: '4', title: 'Evening Reflection & Wind-down', status: 'TODO', estimatedMinutes: 20, scheduledTime: '08:30 PM' },
          ]);
        }
      } catch {
        // Fallback demo tasks
        setTasks([
          { id: '1', title: 'Deep Work Focus Block', status: 'COMPLETED', estimatedMinutes: 60, scheduledTime: '09:00 AM' },
          { id: '2', title: 'Hydration & Electrolytes', status: 'COMPLETED', estimatedMinutes: 10, scheduledTime: '11:00 AM' },
          { id: '3', title: 'Cardio & Sunlight Exposure', status: 'TODO', estimatedMinutes: 45, scheduledTime: '04:30 PM' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' } : t))
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-28">
      {/* View Mode Pill Switcher matching Image 1's 3 screens */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex p-1.5 bg-purple-50/80 rounded-full border border-purple-100 shadow-sm backdrop-blur-md">
          <button
            onClick={() => setActiveScreen('tracker')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeScreen === 'tracker'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-purple-700'
            }`}
          >
            Daily Tracker
          </button>
          <button
            onClick={() => setActiveScreen('trends')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeScreen === 'trends'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-purple-700'
            }`}
          >
            Health Trends
          </button>
          <button
            onClick={() => setActiveScreen('impacts')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeScreen === 'impacts'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-purple-700'
            }`}
          >
            Impacts & Insights
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ============================================================== */}
        {/* SCREEN 1: DAILY TRACKER (IMAGE 1, LEFT PHONE)                  */}
        {/* ============================================================== */}
        {activeScreen === 'tracker' && (
          <motion.div
            key="tracker"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Header: User Avatar + Hello Jacob! + Action Pills */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-sm text-purple-700">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                    Hello, {userName}!
                  </h1>
                  <p className="text-xs text-zinc-400 font-medium">
                    {greeting}
                  </p>
                </div>
              </div>

              {/* Action Buttons matching Image 1 */}
              <div className="flex items-center gap-2">
                <button
                  className="w-10 h-10 rounded-full bg-white border border-purple-100 flex items-center justify-center text-zinc-600 hover:bg-purple-50 shadow-sm transition-colors"
                  aria-label="Filter"
                >
                  <SlidersHorizontal size={17} />
                </button>
                <button
                  className="w-10 h-10 rounded-full bg-white border border-purple-100 flex items-center justify-center text-zinc-600 hover:bg-purple-50 shadow-sm transition-colors"
                  aria-label="Menu"
                >
                  <Menu size={18} />
                </button>
              </div>
            </div>

            {/* Section Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Tracking Your Habits
              </h2>
            </div>

            {/* Day of Week Pill Strip matching Image 1 */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {daysOfWeek.map((item, idx) => {
                const isSelected = selectedDayIndex === idx;

                return (
                  <button
                    key={item.day}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`rounded-2xl py-3 px-1 sm:px-2 flex flex-col items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-md scale-105'
                        : 'bg-white text-zinc-700 border-purple-100 hover:border-purple-200'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                        isSelected ? 'bg-purple-700 text-white' : item.accent
                      }`}
                    >
                      {item.day}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold mt-1">
                      {item.date}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Large Lavender Hero Card matching Image 1 */}
            <div className="rounded-[36px] bg-[#DDD6FE] p-7 sm:p-9 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-purple-900 shadow-sm">
                    <Heart size={16} className="fill-purple-900 text-purple-900" />
                  </div>
                  <span className="text-base sm:text-lg font-bold text-zinc-900">
                    Health & Vitality Tracker
                  </span>
                </div>

                <button
                  onClick={() => setActiveScreen('trends')}
                  className="w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-zinc-900 shadow-sm transition-transform hover:scale-105"
                  aria-label="View Details"
                >
                  <ArrowUpRight size={18} />
                </button>
              </div>

              {/* Vertical Pill Bar Chart with Hatch Patterns matching Image 1 */}
              <div className="flex items-end justify-between gap-3 sm:gap-5 h-44 px-2 sm:px-6">
                {[
                  { day: 'Mon', height: '65%', isSolid: false },
                  { day: 'Tue', height: '90%', isSolid: true }, // The active highlighted black capsule!
                  { day: 'Wed', height: '60%', isSolid: false },
                  { day: 'Thu', height: '45%', isSolid: false },
                  { day: 'Fri', height: '80%', isSolid: false },
                ].map((bar, i) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      style={{ height: bar.height }}
                      className={`w-full max-w-[48px] rounded-full transition-all duration-300 relative ${
                        bar.isSolid
                          ? 'bg-zinc-900 shadow-lg'
                          : 'hatch-pattern bg-white/40 border border-purple-400/40'
                      }`}
                    />
                    <span className="text-xs font-semibold text-zinc-700">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visit / Focus Area Category Cards matching Image 1 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Focus Areas & Routines
                </h3>
                <div className="flex items-center gap-2 text-zinc-400">
                  <SlidersHorizontal size={15} />
                  <Menu size={16} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Soft Blue Card matching Image 1 */}
                <div className="rounded-3xl bg-[#E0F2FE] p-5 border border-sky-200/60 shadow-sm flex flex-col justify-between h-36">
                  <div>
                    <span className="text-xs font-bold text-sky-900">Health Measurements</span>
                    <div className="text-sm font-extrabold text-zinc-900 mt-1">Cognitive Flow & Mind</div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-sky-800 bg-white/70 px-3 py-1 rounded-full">
                      Time 6:15 PM
                    </span>
                    <button
                      onClick={() => setActiveScreen('trends')}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-zinc-800 shadow-sm"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Soft Blush Card matching Image 1 */}
                <div className="rounded-3xl bg-[#FCE7F3] p-5 border border-pink-200/60 shadow-sm flex flex-col justify-between h-36">
                  <div>
                    <span className="text-xs font-bold text-pink-900">Meds & Habits</span>
                    <div className="text-sm font-extrabold text-zinc-900 mt-1">Daily Habit Stacking</div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-pink-800 bg-white/70 px-3 py-1 rounded-full">
                      3 Completed
                    </span>
                    <button
                      onClick={() => setActiveScreen('impacts')}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-zinc-800 shadow-sm"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Tasks Section */}
            <div className="bg-white rounded-[32px] p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Today&rsquo;s Deliberate Actions
                </h3>
                <Link
                  href="/tasks"
                  className="text-xs font-bold text-purple-600 hover:text-purple-800"
                >
                  Manage All
                </Link>
              </div>

              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      task.status === 'COMPLETED'
                        ? 'bg-purple-50/50 border-purple-100 text-zinc-400'
                        : 'bg-white border-zinc-100 hover:border-purple-200 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          task.status === 'COMPLETED'
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-zinc-300 hover:border-purple-600'
                        }`}
                      >
                        {task.status === 'COMPLETED' && <Check size={13} />}
                      </div>
                      <span className={`text-sm font-semibold ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.scheduledTime && (
                        <span className="text-[11px] font-medium text-zinc-400">
                          {task.scheduledTime}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                        {task.estimatedMinutes}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 2: HEALTH TRENDS & AVERAGE MOOD (IMAGE 1, MIDDLE PHONE) */}
        {/* ============================================================== */}
        {activeScreen === 'trends' && (
          <motion.div
            key="trends"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Header with Back button matching Image 1 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('tracker')}
                className="w-9 h-9 rounded-full bg-white border border-purple-100 flex items-center justify-center text-zinc-700 shadow-sm hover:bg-purple-50"
              >
                ←
              </button>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Health Trends
              </h2>
            </div>

            {/* Top Report Card with Illustration matching Image 1 */}
            <div className="rounded-[36px] bg-white p-6 sm:p-8 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
                  🧘‍♀️
                </div>
                <div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold mb-1">
                    Bearable
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900">
                    Health trends
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                    <span>⏱ 30 Days</span>
                    <span>📅 Current Period</span>
                  </div>
                  {/* Yellow progress bar indicator matching Image 1 */}
                  <div className="w-28 h-1.5 bg-amber-200 rounded-full mt-2" />
                </div>
              </div>

              <button
                onClick={() => setActiveScreen('impacts')}
                className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-all"
              >
                View weekly report
              </button>
            </div>

            {/* Dual Pastel Stat Cards matching Image 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Soft Mint Focus Time Card matching Image 1 */}
              <div className="rounded-[32px] bg-[#DCFCE7] p-6 border border-emerald-200 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-center justify-between text-emerald-800">
                  <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <span className="text-xs">⚙️</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Focus Time
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-0.5">
                    2h 15m
                  </div>
                </div>
              </div>

              {/* Soft Blue Mood Level Card matching Image 1 */}
              <div className="rounded-[32px] bg-[#E0F2FE] p-6 border border-sky-200 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-center justify-between text-sky-800">
                  <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center">
                    <Smile size={16} />
                  </div>
                  <button
                    onClick={() => setMoodLevel((prev) => (prev >= 10 ? 1 : prev + 1))}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sky-900 shadow-sm hover:scale-105"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div>
                  <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                    Mood Level
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-0.5">
                    {moodLevel}/10
                  </div>
                </div>
              </div>
            </div>

            {/* Average Mood Vertical Pill Capsules matching Image 1 */}
            <div className="rounded-[36px] bg-white p-7 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-zinc-900">
                  Average Mood
                </h3>
                <button
                  onClick={() => setActiveScreen('impacts')}
                  className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-zinc-800 hover:bg-purple-100 shadow-sm"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>

              {/* Vertical Rounded Pill Capsules matching Image 1 */}
              <div className="grid grid-cols-4 gap-4 sm:gap-6 h-56 items-end px-2 sm:px-8">
                {[
                  { percentage: '100%', fill: 'h-full bg-purple-400' },
                  { percentage: '35%', fill: 'h-[35%] bg-purple-300' },
                  { percentage: '75%', fill: 'h-[75%] bg-purple-400' },
                  { percentage: '45%', fill: 'h-[45%] bg-purple-300' },
                ].map((col, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full max-w-[56px] h-full rounded-full bg-[#FAF5FF] p-1 flex flex-col justify-end border border-purple-100 overflow-hidden">
                      <div
                        style={{ height: col.percentage }}
                        className="w-full rounded-full bg-gradient-to-t from-purple-400 to-indigo-300 transition-all duration-500"
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-700 mt-1">
                      {col.percentage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 3: IMPACTS & INSIGHTS (IMAGE 1, RIGHT PHONE)             */}
        {/* ============================================================== */}
        {activeScreen === 'impacts' && (
          <motion.div
            key="impacts"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Header with Back button matching Image 1 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('tracker')}
                className="w-9 h-9 rounded-full bg-white border border-purple-100 flex items-center justify-center text-zinc-700 shadow-sm hover:bg-purple-50"
              >
                ←
              </button>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Impacts & Behavioral Correlations
              </h2>
            </div>

            {/* Filter Pills matching Image 1 */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-purple-100 text-xs font-semibold text-zinc-700 shadow-sm">
                <span>Factors</span>
                <ChevronDown size={13} />
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-purple-100 text-xs font-semibold text-zinc-700 shadow-sm">
                <span>Mood</span>
                <ChevronDown size={13} />
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-purple-100 text-xs font-semibold text-zinc-700 shadow-sm">
                <span>Same day</span>
                <ChevronDown size={13} />
              </button>
            </div>

            {/* Donut Ring Chart Card matching Image 1 */}
            <div className="rounded-[36px] bg-white p-7 border border-purple-100 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
              {/* Legend on Left */}
              <div className="sm:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Factors</div>
                    <div className="text-xl font-extrabold text-zinc-900">28</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-purple-400" />
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Mood</div>
                    <div className="text-xl font-extrabold text-zinc-900">20</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-sky-300" />
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Same day</div>
                    <div className="text-xl font-extrabold text-zinc-900">31</div>
                  </div>
                </div>
              </div>

              {/* Segmented Donut Ring on Right matching Image 1 */}
              <div className="sm:col-span-7 flex items-center justify-center">
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Ring background */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#FAF5FF"
                      strokeWidth="16"
                    />
                    {/* Segment 1: Charcoal (Dark) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#18181B"
                      strokeWidth="16"
                      strokeDasharray="95 238"
                      strokeDashoffset="0"
                    />
                    {/* Segment 2: Lavender */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#DDD6FE"
                      strokeWidth="16"
                      strokeDasharray="75 238"
                      strokeDashoffset="-95"
                    />
                    {/* Segment 3: Butter Yellow */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#FDE68A"
                      strokeWidth="16"
                      strokeDasharray="68 238"
                      strokeDashoffset="-170"
                    />
                  </svg>
                  {/* Center badge */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-zinc-700 bg-white px-3 py-1 rounded-full shadow-sm border border-purple-100">
                      79 Signals
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-grid of Cards matching Image 1 bottom right phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Screen time card */}
              <div className="rounded-[32px] bg-white p-5 border border-purple-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Clock size={15} />
                  <span className="text-xs font-bold">Focus distribution</span>
                </div>
                <div className="flex items-end gap-2 h-16 my-auto">
                  <div className="w-1/4 h-[75%] bg-purple-300 rounded-full" />
                  <div className="w-1/4 h-[40%] bg-purple-300 rounded-full" />
                  <div className="w-1/4 h-[60%] bg-purple-300 rounded-full" />
                  <div className="w-1/4 h-[90%] bg-purple-400 rounded-full" />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold pt-1">
                  <span>4 Days</span>
                  <span>48h Total</span>
                </div>
              </div>

              {/* Calendar mini heatmap card matching Image 1 */}
              <div className="rounded-[32px] bg-white p-5 border border-purple-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-center gap-2 text-zinc-700 mb-2">
                  <CalendarIcon size={15} />
                  <span className="text-xs font-bold">Calendar Adherence</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                  {['1', '2', '3', '8', '10', '12', '15', '16'].map((num, i) => (
                    <div
                      key={i}
                      className="h-6 rounded-lg bg-purple-200 text-purple-900 flex items-center justify-center"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Magnesium / Recovery card matching Image 1 */}
              <div className="rounded-[32px] bg-white p-5 border border-purple-100 shadow-sm flex flex-col justify-between h-36">
                <div className="text-xs font-bold text-zinc-700">Sleep & Vitality</div>
                <div className="space-y-2">
                  <div className="w-3/4 h-3 bg-purple-200 rounded-full ml-auto" />
                  <div className="w-1/2 h-3 bg-purple-300 rounded-full" />
                  <div className="w-1/3 h-3 bg-purple-400 rounded-full mx-auto" />
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold">Deep rest: 7h 42m</span>
              </div>

              {/* Time matrix grid with hatch pattern matching Image 1 */}
              <div className="rounded-[32px] bg-white p-5 border border-purple-100 shadow-sm flex flex-col justify-between h-36">
                <div className="text-xs font-bold text-zinc-700">Rhythm Matrix</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 rounded-md ${
                        i % 2 === 0
                          ? 'hatch-pattern bg-purple-100/80 border border-purple-200/50'
                          : 'bg-purple-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold">Optimal flow state</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Navigation Pill Dock matching Image 1 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/95 backdrop-blur-xl rounded-full p-2 border border-purple-100 shadow-2xl shadow-purple-900/10 flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('tracker')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeScreen === 'tracker'
                ? 'bg-zinc-900 text-white shadow-md'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Home size={15} />
            <span>Today</span>
          </button>

          <button
            onClick={() => setActiveScreen('trends')}
            className={`p-2.5 rounded-full transition-colors ${
              activeScreen === 'trends'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            aria-label="Trends"
          >
            <Grid size={17} />
          </button>

          <button
            onClick={() => setActiveScreen('impacts')}
            className={`p-2.5 rounded-full transition-colors ${
              activeScreen === 'impacts'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            aria-label="Impacts"
          >
            <BarChart3 size={17} />
          </button>

          <Link
            href="/profile"
            className="p-2.5 rounded-full text-zinc-500 hover:text-zinc-900 transition-colors"
            aria-label="Profile"
          >
            <User size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
