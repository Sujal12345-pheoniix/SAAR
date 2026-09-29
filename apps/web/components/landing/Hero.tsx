'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Scale, Sparkles } from 'lucide-react';
import { BecomingField } from './BecomingField';

export function Hero() {
  return (
    <section
      id="becoming"
      className="relative min-h-[92vh] flex flex-col items-center justify-start overflow-hidden pt-32 pb-20 px-4 sm:px-6"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background Subtle Organic Lighting */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] pointer-events-none opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 10%, rgba(34,105,73,0.12) 0%, rgba(245,242,235,0.8) 55%, transparent 75%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Subtle Category Pill */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase text-[#495057] bg-[#F5F2EB] border border-[rgba(15,17,21,0.06)] mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#226949]" />
          Personal Growth Intelligence
        </motion.div>

        {/* Editorial Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-editorial text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0F1115] leading-[1.08] max-w-4xl"
        >
          Meet the person <br className="hidden sm:inline" />
          <span className="italic font-normal text-[#226949]">you’re becoming.</span>
        </motion.h1>

        {/* Subheading — The Central Philosophy */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-[#495057] max-w-2xl mx-auto leading-relaxed mt-6 mb-8 font-interface"
        >
          You are not managing tasks. You are understanding the person behind the tasks.
          SAAR compares how you actually live against who you want to be — and helps you close the gap through deliberate action.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-medium text-base bg-[#226949] hover:bg-[#1B543A] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <span>Begin Understanding Yourself</span>
            <ArrowRight size={17} />
          </Link>

          <a
            href="#how-it-thinks"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#0F1115] border border-[rgba(15,17,21,0.1)] transition-all shadow-sm hover:-translate-y-0.5"
          >
            Explore How SAAR Thinks
          </a>
        </motion.div>

        {/* Signature Interactive Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mb-14"
        >
          <BecomingField />
        </motion.div>

        {/* Trust Badges / Restrained Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-6 border-t border-[rgba(15,17,21,0.06)] text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#F5F2EB] text-[#226949]">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0F1115]">Deterministic Evidence</div>
              <div className="text-xs text-[#868E96] mt-0.5">
                Signals computed from real behavior logs. No vanity streaks or gamified gimmicks.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#F5F2EB] text-[#B45309]">
              <Scale size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0F1115]">Capacity-Aware Scheduling</div>
              <div className="text-xs text-[#868E96] mt-0.5">
                Calibrated to realistic human limits. Never commands you to blindly &quot;do more.&quot;
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#F5F2EB] text-[#4D5091]">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0F1115]">Data Sovereignty by Design</div>
              <div className="text-xs text-[#868E96] mt-0.5">
                Every AI memory is consented, visible, and revokable by you at any moment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
