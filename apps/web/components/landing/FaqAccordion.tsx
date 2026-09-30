'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

const FAQS = [
  {
    q: 'How does SAAR track habits and coach me?',
    a: 'SAAR links your long-term goals with your daily recurring routines. As you complete habits, log focus sessions, and check in, our deterministic intelligence engine calculates adherence, execution friction, and momentum signals over 7-day and 30-day windows.',
  },
  {
    q: 'Is SAAR free to use?',
    a: 'Yes. SAAR provides a generous free tier that includes full habit tracking, life domain balancing, calendar scheduling, and daily check-ins. Advanced AI memory and multi-month pattern coaching are available on our premium plans.',
  },
  {
    q: 'How accurate are the AI insights?',
    a: 'Unlike generic chatbots, SAAR uses real behavioral feature extraction. Insights and notifications are only generated when minimum statistical sample thresholds are met, ensuring recommendations are grounded in reality.',
  },
  {
    q: 'Is my personal reflection and journal data private?',
    a: 'Absolutely. We enforce strict database-level row isolation and AES-256 encryption for sensitive reflection logs. Your private memories and thoughts are never used to train public machine learning models.',
  },
  {
    q: 'How do morning and evening check-ins work?',
    a: 'Morning check-ins take under 60 seconds to prime your daily focus and check energy. Evening check-ins celebrate completed tasks, log blockers, and help you wind down without cognitive overload.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-4xl mx-auto">
        {/* Header Centered */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Support & Clarity
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Frequently Asked Questions
          </h2>

          <p className="text-base text-slate-600 font-normal leading-relaxed">
            Find clear answers about our behavioral models, privacy commitments, and methodology.
          </p>
        </div>

        {/* Accordion List Centered */}
        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 transition-transform duration-200 border border-slate-200 ${
                      isOpen ? 'rotate-180 text-slate-900' : ''
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
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-100">
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
