'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

const FAQS = [
  {
    q: 'How does SAAR track habits and coach me?',
    a: 'SAAR connects your stated long-term goals with your daily routines. When you log tasks, check in with your mood, or complete habits, our deterministic intelligence engine identifies behavioral gaps, momentum trends, and energy patterns, offering gentle guidance without nagging.',
  },
  {
    q: 'Is SAAR free to use?',
    a: 'Yes, SAAR provides a generous free tier that includes full habit tracking, life area balancing, and daily check-ins. Advanced AI memory and multi-month pattern coaching are available on our premium plans with transparent pricing.',
  },
  {
    q: 'How accurate are the AI insights?',
    a: 'Unlike generic chatbots, SAAR uses real behavioral feature extraction calculated over 7-day and 30-day evidence windows. Insights are only generated when minimum statistical sample thresholds are met, ensuring recommendations are grounded in reality.',
  },
  {
    q: 'Is my personal reflection and journal data private?',
    a: 'Absolutely. We use strict database-level row isolation and AES-256 encryption for sensitive reflection logs. Your private memories and thoughts are never used to train public machine learning models.',
  },
  {
    q: 'How do morning and evening check-ins work?',
    a: 'Morning check-ins take under 60 seconds to prime your daily focus and check energy. Evening check-ins celebrate wins, note blockers, and help you wind down without cognitive overload.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-purple-100/60">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column — Title & Subtext matching Image 2 */}
        <div className="lg:col-span-5 flex flex-col items-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={12} />
            Support & Clarity
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-4">
            Frequently Asked <br />
            Questions
          </h2>

          <p className="text-sm text-zinc-500 font-normal leading-relaxed max-w-sm">
            Find clear answers to common questions about our behavioral intelligence, daily coaching, and privacy commitments.
          </p>
        </div>

        {/* Right Column — Accordion List matching Image 2 */}
        <div className="lg:col-span-7 space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-purple-100/80 bg-[#FAF9FF] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-zinc-900">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-white flex items-center justify-center text-zinc-500 transition-transform duration-200 border border-purple-100 ${
                      isOpen ? 'rotate-180 text-purple-700' : ''
                    }`}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal border-t border-purple-100/50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
