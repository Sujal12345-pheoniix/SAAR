'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, RotateCcw, Clock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface SimulatedTask {
  id: string;
  title: string;
  durationMinutes: number;
  area: 'career' | 'health' | 'mind' | 'personal';
  moved: boolean;
  reduced: boolean;
}

const INITIAL_TASKS: SimulatedTask[] = [
  { id: 't1', title: 'Deep Architecture Sprint: Outbox Engine', durationMinutes: 90, area: 'career', moved: false, reduced: false },
  { id: 't2', title: 'Client Strategic Alignment Call', durationMinutes: 60, area: 'career', moved: false, reduced: false },
  { id: 't3', title: 'Team Backlog & PR Review Session', durationMinutes: 60, area: 'career', moved: false, reduced: false },
  { id: 't4', title: 'Zone 2 Aerobic Conditioning Run', durationMinutes: 45, area: 'health', moved: false, reduced: false },
  { id: 't5', title: 'Technical Writing: Growth Engine RFC', durationMinutes: 75, area: 'career', moved: false, reduced: false },
  { id: 't6', title: 'Evening Code Review & Bug Triage', durationMinutes: 60, area: 'career', moved: false, reduced: false },
  { id: 't7', title: 'Secondary Project Sync Call', durationMinutes: 40, area: 'personal', moved: false, reduced: false },
  { id: 't8', title: 'Mindful Evening Reading & Reflection', durationMinutes: 30, area: 'mind', moved: false, reduced: false },
  { id: 't9', title: 'Daily Logistics & Inbox Processing', durationMinutes: 45, area: 'career', moved: false, reduced: false },
  { id: 't10', title: 'Meal Prep & Nutrition Setup', durationMinutes: 40, area: 'health', moved: false, reduced: false },
];

const SUSTAINABLE_CAPACITY_MINUTES = 450; // 7h 30m

export function PlannerSimulator() {
  const [tasks, setTasks] = useState<SimulatedTask[]>(INITIAL_TASKS);

  const activeTasks = tasks.filter((t) => !t.moved);
  const totalMinutes = activeTasks.reduce((acc, t) => acc + (t.reduced ? Math.round(t.durationMinutes * 0.6) : t.durationMinutes), 0);
  const isOverloaded = totalMinutes > SUSTAINABLE_CAPACITY_MINUTES;
  const overloadDiff = totalMinutes - SUSTAINABLE_CAPACITY_MINUTES;

  const handleMoveTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, moved: true } : t)));
  };

  const handleReduceTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, reduced: !t.reduced } : t)));
  };

  const handleReset = () => {
    setTasks(INITIAL_TASKS);
  };

  // Trade-off ratio
  const workMinutes = activeTasks
    .filter((t) => t.area === 'career')
    .reduce((acc, t) => acc + (t.reduced ? Math.round(t.durationMinutes * 0.6) : t.durationMinutes), 0);
  const recoveryMinutes = activeTasks
    .filter((t) => t.area === 'health' || t.area === 'mind')
    .reduce((acc, t) => acc + t.durationMinutes, 0);

  const totalTracked = workMinutes + recoveryMinutes || 1;
  const workPercent = Math.round((workMinutes / totalTracked) * 100);
  const recoveryPercent = 100 - workPercent;

  return (
    <section id="tradeoffs" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="max-w-2xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#226949] bg-[rgba(34,105,73,0.08)] mb-3">
          <span>04 • What Should I Do Next?</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-800 font-medium normal-case">Illustrative Demo</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#0F1115] tracking-tight leading-tight">
          A planner that understands <br />
          <span className="italic font-normal text-[#226949]">human capacity & trade-offs.</span>
        </h2>
        <p className="text-base sm:text-lg text-[#495057] mt-4 leading-relaxed font-interface">
          SAAR never tells you to blindly &ldquo;do more.&rdquo; Try adjusting the overloaded schedule below to see how capacity recalibration preserves recovery without sacrificing critical outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 cols: Task Schedule with interactive adjustment triggers */}
        <div className="lg:col-span-7 rounded-3xl bg-[#FFFFFF] border border-[rgba(15,17,21,0.08)] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(15,17,21,0.06)]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
                Interactive Day Planner
              </span>
              <h3 className="font-editorial text-xl font-bold text-[#0F1115] mt-0.5">
                Today&apos;s Planned Commitments
              </h3>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#495057] hover:text-[#0F1115] hover:bg-[#F5F2EB] transition-colors"
            >
              <RotateCcw size={13} />
              Reset Plan
            </button>
          </div>

          {/* Overload Alert or Calibrated Banner */}
          {isOverloaded ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-[rgba(155,44,44,0.06)] border border-[rgba(155,44,44,0.18)] mb-6 text-sm flex items-start gap-3"
            >
              <ShieldAlert className="text-[#9B2C2C] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="text-[#9B2C2C] font-semibold">
                  Cognitive Overload Warning: Exceeds sustainable limit by {Math.floor(overloadDiff / 60)}h{' '}
                  {overloadDiff % 60}m.
                </strong>
                <p className="text-xs text-[#495057] mt-1">
                  Executing this unadjusted schedule carries an elevated risk of evening exhaustion and skipped recovery rituals. Click a suggested action below to recalibrate.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-[rgba(34,105,73,0.08)] border border-[rgba(34,105,73,0.2)] mb-6 text-sm flex items-center gap-3"
            >
              <CheckCircle2 className="text-[#226949] flex-shrink-0" size={18} />
              <div>
                <strong className="text-[#226949] font-semibold">
                  Calibrated Equilibrium Achieved ({Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m).
                </strong>
                <p className="text-xs text-[#495057] mt-0.5">
                  High-leverage work protected with a healthy 75-minute shutdown buffer before sleep.
                </p>
              </div>
            </motion.div>
          )}

          {/* Task List */}
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const currentDuration = task.reduced ? Math.round(task.durationMinutes * 0.6) : task.durationMinutes;

              if (task.moved) {
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-dashed border-[rgba(15,17,21,0.1)] text-xs text-[#868E96] flex items-center justify-between"
                  >
                    <span className="line-through">{task.title}</span>
                    <span className="text-[#226949] font-medium">Moved to Tomorrow ✓</span>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.06)] hover:border-[rgba(15,17,21,0.12)] transition-all flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-[200px]">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          task.area === 'career'
                            ? '#B45309'
                            : task.area === 'health'
                            ? '#226949'
                            : task.area === 'mind'
                            ? '#4D5091'
                            : '#868E96',
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium text-[#0F1115]">{task.title}</div>
                      <div className="text-xs text-[#868E96] flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} />
                        <span className="tabular-nums font-semibold">{currentDuration}m</span>
                        {task.reduced && <span className="text-[#226949] font-semibold">(40% condensed)</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReduceTask(task.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        task.reduced
                          ? 'bg-[#226949] text-white border-[#226949]'
                          : 'bg-[#FFFFFF] text-[#495057] border-[rgba(15,17,21,0.1)] hover:bg-[#F5F2EB]'
                      }`}
                      title="Condense duration by focusing on core deliverables"
                    >
                      {task.reduced ? 'Restore' : `Condense (-${task.durationMinutes - Math.round(task.durationMinutes * 0.6)}m)`}
                    </button>
                    <button
                      onClick={() => handleMoveTask(task.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#495057] border border-[rgba(15,17,21,0.1)] transition-colors"
                      title="Shift to tomorrow"
                    >
                      Move → (-{currentDuration}m)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 cols: Capacity Meter & Live Trade-off Gauge */}
        <div className="lg:col-span-5 space-y-6">
          {/* Capacity Gauge Card */}
          <div className="rounded-3xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.08)] p-6 sm:p-7 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
              Real-Time Capacity Calibration
            </span>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-editorial font-bold text-[#0F1115] tabular-nums">
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </span>
                <span className="text-xs text-[#868E96] ml-2">planned today</span>
              </div>

              <div className="text-right">
                <span className="text-sm font-semibold tabular-nums text-[#495057]">
                  7h 30m
                </span>
                <div className="text-[11px] text-[#868E96]">Sustainable Limit</div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full h-3 bg-[#E8E4DC] rounded-full mt-4 overflow-hidden relative">
              <motion.div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((totalMinutes / SUSTAINABLE_CAPACITY_MINUTES) * 100, 100)}%`,
                  backgroundColor: isOverloaded ? '#9B2C2C' : '#226949',
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#868E96] mt-2">
              <span>0h</span>
              <span>4h</span>
              <span className="font-semibold text-[#0F1115]">7h 30m (Target)</span>
              <span>10h</span>
            </div>
          </div>

          {/* Trade-off Equilibrium Visualizer */}
          <div className="rounded-3xl bg-[#0F1115] text-[#FAF8F5] p-6 sm:p-7 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#868E96]">
                Priority Trade-off
              </span>
              <span className="text-xs text-[#226949] font-semibold flex items-center gap-1">
                <Sparkles size={12} /> Adaptive Balance
              </span>
            </div>

            <h4 className="font-editorial text-2xl font-bold text-[#FAF8F5] mb-2">
              Craft ↕ Recovery Balance
            </h4>
            <p className="text-xs text-[#C5CCD3] leading-relaxed mb-6">
              Energy is finite. Every extra hour spent on craft borrows directly from physical vitality and emotional clarity.
            </p>

            {/* Visual Trade-off Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#B45309]">Craft & Output ({workPercent}%)</span>
                <span className="text-[#226949]">Recovery & Space ({recoveryPercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden flex">
                <motion.div
                  className="h-full bg-[#B45309]"
                  style={{ width: `${workPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="h-full bg-[#226949]"
                  style={{ width: `${recoveryPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)] text-xs text-[#868E96]">
              {isOverloaded
                ? 'High danger of evening recovery truncation. Move or condense tasks to restore equilibrium.'
                : 'Balanced ratio. Protected runway for deep sleep and vital recovery.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
