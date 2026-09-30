'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Apple, Play, Sparkles } from 'lucide-react';
import React from 'react';

export function AppDownloadBanner() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#FAF9FF] rounded-[44px] p-8 sm:p-12 lg:p-16 border border-purple-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative overflow-hidden">
          {/* Subtle decorative purple glow */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

          {/* Left Column — Text & Store Badges matching Image 2 */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 flex flex-col items-start"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-4">
              Download the App <br />
              and Start Building <br />
              Better Habits Today!
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal mb-8 max-w-md">
              Take control of your wellness journey with personalized AI insights. Track your progress, stay consistent, and achieve your goals — seamlessly on web and mobile.
            </p>

            {/* Store Buttons matching Image 2 */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Apple size={22} className="fill-white" />
                <div className="text-left">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider leading-none">
                    Download on the
                  </div>
                  <div className="text-xs font-bold leading-tight mt-0.5">App Store</div>
                </div>
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md hover:shadow-lg transition-all"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-base">▶</span>
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider leading-none">
                    Get it on
                  </div>
                  <div className="text-xs font-bold leading-tight mt-0.5">Google Play</div>
                </div>
              </Link>
            </div>

            {/* Social Proof Pill matching Image 2 */}
            <div className="flex items-center gap-3 pt-4 border-t border-purple-100 w-full max-w-xs">
              <div className="flex -space-x-2">
                {['👨‍💼', '👩‍🔬', '🏃‍♀️'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs shadow-sm"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">250K+</div>
                <div className="text-[10px] text-zinc-500">Trusted Worldwide</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column — Dual Angled Phone Mockups matching Image 2 */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-6 relative flex items-center justify-center pt-8 lg:pt-0"
          >
            {/* Phone 1 (Foreground) */}
            <div className="relative z-10 w-[210px] sm:w-[230px] rounded-[38px] bg-zinc-900 p-2.5 shadow-2xl border-4 border-zinc-800 -rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="w-full bg-[#FAF9FF] rounded-[30px] overflow-hidden p-3.5 text-zinc-900">
                <div className="w-20 h-4 bg-zinc-900 rounded-full mx-auto mb-2" />
                <div className="text-[10px] text-zinc-400 font-semibold mb-1">Overall Performance</div>
                <div className="text-xl font-bold font-mono text-zinc-900 mb-2">87:23:05</div>
                <div className="w-full bg-purple-100 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-purple-600 h-full w-[85%] rounded-full" />
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-purple-100 mb-2">
                  <div className="text-[10px] font-bold text-zinc-900">Deep Work</div>
                  <div className="text-[9px] text-emerald-600 font-semibold">Done · 2h 15m</div>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-purple-100">
                  <div className="text-[10px] font-bold text-zinc-900">Evening Walk</div>
                  <div className="text-[9px] text-purple-600 font-semibold">Scheduled</div>
                </div>
              </div>
            </div>

            {/* Phone 2 (Angled Background) */}
            <div className="relative -ml-16 sm:-ml-20 w-[200px] sm:w-[220px] rounded-[38px] bg-zinc-900 p-2.5 shadow-xl border-4 border-zinc-800 rotate-6 hover:rotate-3 transition-transform duration-300 opacity-95">
              <div className="w-full bg-[#FAF9FF] rounded-[30px] overflow-hidden p-3.5 text-zinc-900">
                <div className="w-20 h-4 bg-zinc-900 rounded-full mx-auto mb-2" />
                <div className="text-[10px] text-zinc-400 font-semibold mb-1">Monthly Adherence</div>
                <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100 mb-2">
                  <div className="text-[9px] font-bold text-emerald-800">November Progress</div>
                  <div className="text-[11px] font-bold text-emerald-700">19/24 Days Done</div>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[9px] text-center">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 rounded-md flex items-center justify-center font-medium ${
                        i % 2 === 0 ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-900'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
