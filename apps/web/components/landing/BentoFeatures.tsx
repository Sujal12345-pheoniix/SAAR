'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, Heart, Zap, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

export function BentoFeatures() {
  const [selectedDay, setSelectedDay] = useState<number>(14);

  // November calendar days 1 to 30
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const completedDays = [1, 2, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 18, 19, 20, 22, 23, 24];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF9FF] relative overflow-hidden">
      {/* Background soft ambient blur */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Section Headline matching Image 2 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <Sparkles size={12} />
            Growth Architecture
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight leading-[1.18]"
          >
            Track Your Daily Habits, Improve Them with Personalized AI Coaching, and Achieve Your Wellness Goals Using Data-Driven Insights
          </motion.h2>
        </div>

        {/* Bento Grid Layout matching Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Card 1 — Mint Green Habit Tracker Card (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 bg-[#E8F8F0] rounded-[36px] p-8 sm:p-10 flex flex-col justify-between border border-emerald-200/60 shadow-sm relative overflow-hidden group"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Text side */}
              <div className="md:col-span-6 flex flex-col items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-white/80 px-3 py-1 rounded-full mb-4">
                  Personalized AI Coaching
                </span>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug mb-3">
                  Easily Track Your <br />
                  Daily Habits
                </h3>

                <p className="text-sm text-zinc-600 leading-relaxed mb-6 font-normal">
                  Easily monitor your habits like exercise, hydration, sleep, and focus. Get an honest overview of how consistent you are and where you can improve without burnout.
                </p>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all shadow-sm hover:shadow"
                >
                  <span>Get Started For Free</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Mini Calendar Mockup matching Image 2 */}
              <div className="md:col-span-6 bg-white rounded-3xl p-5 shadow-lg shadow-emerald-900/5 border border-emerald-100">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                      V
                    </div>
                    <span className="text-xs font-bold text-zinc-900">Veronika</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">Monthly Calendar</span>
                </div>

                {/* Habit preview badge */}
                <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-100/60 mb-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-zinc-800">Sunbathing / Focus</span>
                    <span className="text-emerald-700 font-semibold text-[10px]">82% Excellent</span>
                  </div>
                  <div className="w-full bg-emerald-200/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[82%] rounded-full" />
                  </div>
                </div>

                {/* Month title */}
                <div className="text-[11px] font-bold text-zinc-800 mb-2 flex items-center justify-between">
                  <span>November</span>
                  <span className="text-[10px] text-zinc-400">19 Days Active</span>
                </div>

                {/* 30-Day Grid */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
                  {days.map((day) => {
                    const isDone = completedDays.includes(day);
                    const isSelected = selectedDay === day;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-medium transition-all ${
                          isSelected
                            ? 'bg-zinc-900 text-white font-bold shadow-sm'
                            : isDone
                            ? 'bg-amber-100 text-amber-900 font-semibold'
                            : 'text-zinc-400 hover:bg-zinc-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2 — Soft Blue/Lavender AI Companion Card (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 bg-[#EFF6FF] rounded-[36px] p-8 sm:p-10 flex flex-col justify-between border border-blue-200/60 shadow-sm relative overflow-hidden"
          >
            {/* Top Companion Avatar with Dialogue */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Avatar Frame */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-400 via-pink-400 to-indigo-400 p-1 shadow-md">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl shadow-inner">
                    🧘‍♀️
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-purple-100">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              {/* Chat Bubble matching Image 2 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 text-left max-w-xs relative mb-4">
                <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                  &ldquo;You&rsquo;re doing great with your daily flow! Want to take a 10-minute focus break now?&rdquo;
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-400">12:16 PM</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100">
                    Why?
                  </span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">
                Get Tailored Advice <br />
                from SAAR
              </h3>

              <p className="text-xs text-zinc-600 leading-relaxed font-normal max-w-xs">
                Track your exercise, hydration, focus, and energy. See your progress and discover blindspots before they compound.
              </p>
            </div>

            <div className="pt-4 border-t border-blue-200/60 flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                <span>Adaptive Companion Engine</span>
                <Sparkles size={13} />
              </span>
            </div>
          </motion.div>

          {/* Bottom Bento Row — Cards 3 & 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 bg-white rounded-[32px] p-7 border border-purple-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Heart size={18} />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 mb-1">
                All Your Habits in One Place
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Connect health, craft, mind, and relationships without switching between 5 disconnected productivity tools.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
              <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                Mind & Focus
              </span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                Vigor & Health
              </span>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                Craft
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="lg:col-span-7 bg-white rounded-[32px] p-7 border border-purple-100 shadow-sm flex flex-col justify-between"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Zap size={18} />
                </div>
                <h4 className="text-xl font-bold text-zinc-900 mb-1">
                  Save and Track your Growth Topics
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
                  Easily monitor your habits, study sessions, and daily routines. Get an accurate picture of how consistent you are over 7-day and 30-day windows.
                </p>
              </div>

              <div className="flex-shrink-0">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-zinc-900 text-white hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <span>Explore Engine</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
