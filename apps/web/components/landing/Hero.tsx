'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, Play, CheckCircle2, Flame, Heart, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

export function Hero() {
  const [activeTab, setActiveTab] = useState<'overview' | 'habits'>('overview');

  return (
    <section
      id="home"
      className="relative min-h-[95vh] flex flex-col justify-center overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8 aura-mesh-landing"
    >
      {/* Background Organic Ambient Spheres */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-gradient-to-tr from-purple-300/35 via-pink-200/30 to-indigo-200/20 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-48 -left-20 w-80 h-80 bg-purple-200/40 blur-2xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column — Typography & Actions */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 flex flex-col items-start text-left"
        >
          {/* Review Score Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-purple-200/70 shadow-sm backdrop-blur-md mb-6"
          >
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-semibold text-zinc-800">
              4.9 Reviews Score
            </span>
          </motion.div>

          {/* Master Headline matching Image 2 */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.12]"
          >
            Take Control of <br />
            Your Daily Habits with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800">
              AI-Powered Coaching
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg sm:text-xl text-zinc-600 max-w-xl leading-relaxed mt-6 mb-8 font-normal"
          >
            Track your habits, improve your health, and take control of your wellness with thoughtful, AI-powered daily insights and honest behavioral reflection.
          </motion.p>

          {/* Dual Pill CTA Buttons matching Image 2 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex flex-wrap items-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started For Free</span>
              <ArrowRight size={17} />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-medium bg-white/90 hover:bg-white text-zinc-800 border border-purple-200/80 shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5"
            >
              <Play size={15} className="fill-purple-600 text-purple-600" />
              <span>See How It Works</span>
            </a>
          </motion.div>

          {/* Trust metric tags */}
          <div className="flex items-center gap-6 mt-10 pt-6 border-t border-purple-100/80 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Grounded in Behavioral Science</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column — Central Smartphone Mockup matching Image 2 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 relative flex items-center justify-center"
        >
          {/* Floating Companion Avatar Pill */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 -left-6 sm:-left-10 z-20 bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-purple-100 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
              🤖
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                <span>SAAR Coach</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[11px] text-zinc-500">
                &ldquo;Ready for daily reflection?&rdquo;
              </div>
            </div>
          </motion.div>

          {/* Floating Streak Pill */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-4 -right-4 sm:-right-8 z-20 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-xl border border-purple-100 flex items-center gap-2.5"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Flame size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900">14-Day Streak</div>
              <div className="text-[10px] text-emerald-600 font-medium">+12% consistency</div>
            </div>
          </motion.div>

          {/* Smartphone Hardware Frame */}
          <div className="relative w-[300px] sm:w-[320px] rounded-[44px] bg-zinc-900 p-3 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.35)] border-4 border-zinc-800">
            {/* Screen Glass */}
            <div className="w-full bg-[#FAF9FF] rounded-[36px] overflow-hidden p-4 text-zinc-900 relative shadow-inner">
              {/* Dynamic Island / Notch */}
              <div className="w-28 h-5 bg-zinc-900 rounded-full mx-auto mb-3 flex items-center justify-end px-2">
                <span className="w-2 h-2 rounded-full bg-zinc-700" />
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-purple-700">
                      V
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">Veronika</div>
                    <div className="text-[10px] text-zinc-400">Mindful Builder</div>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-purple-100/60 flex items-center justify-center text-purple-700">
                  <Sparkles size={13} />
                </div>
              </div>

              {/* Performance Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100/60 mb-3">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium mb-1">
                  <span>Overall Performance</span>
                  <span className="text-emerald-600 font-semibold">Active</span>
                </div>

                {/* Big Digital Habit Counter */}
                <div className="text-2xl font-extrabold tracking-tight text-zinc-900 my-1 font-mono">
                  87:23:05
                </div>

                {/* Progress bar */}
                <div className="w-full bg-purple-50 h-2 rounded-full overflow-hidden my-2">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-[82%] rounded-full" />
                </div>

                {/* Badge */}
                <div className="flex items-center justify-between pt-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    82% Excellent
                  </div>
                  <span className="text-[10px] text-zinc-400">Keep going!</span>
                </div>
              </div>

              {/* Habit Tracker Section */}
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-purple-100/60">
                <div className="text-[11px] font-bold text-zinc-900 mb-2.5 flex items-center justify-between">
                  <span>Daily Rhythms</span>
                  <span className="text-[10px] text-purple-600 font-semibold cursor-pointer">View All</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100/40">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                      <span className="text-xs font-semibold text-zinc-800">Deep Work Focus</span>
                    </div>
                    <span className="text-[10px] font-semibold text-purple-700 bg-white px-2 py-0.5 rounded-full">
                      2h 15m
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100/40">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                      <span className="text-xs font-semibold text-zinc-800">Sunlight & Motion</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-500 flex items-center justify-center text-[10px]">
                        ○
                      </div>
                      <span className="text-xs font-medium text-zinc-600">Evening Reflection</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">8:30 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
