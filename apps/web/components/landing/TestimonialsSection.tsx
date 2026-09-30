'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import React from 'react';

const TESTIMONIALS = [
  {
    name: 'David Allison',
    role: 'Founder & Software Architect',
    rating: 5,
    quote:
      'The interface is remarkably clear and uncluttered. I feel completely in control of my daily focus and cognitive bandwidth without being overwhelmed by notifications.',
  },
  {
    name: 'Sarah Brown',
    role: 'Design Director',
    rating: 5,
    quote:
      'I’ve tried dozens of habit trackers, but SAAR stands out. The honest 7-day and 30-day baseline comparisons help me identify when my workload is genuinely getting out of balance.',
  },
  {
    name: 'Emily Davis',
    role: 'Cognitive Science Researcher',
    rating: 5,
    quote:
      'The absence of artificial gamification is a breath of fresh air. The check-ins and reflection logs provide authentic feedback that respects my mental state.',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        {/* Header Centered */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className="fill-amber-500 text-amber-500" />
            ))}
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            What Deliberate Builders Say
          </h2>

          <p className="text-base text-slate-600 font-normal leading-relaxed">
            See how founders, researchers, and mindful practitioners use SAAR to achieve sustainable clarity.
          </p>
        </div>

        {/* 3 Modern Cards Centered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-500 text-amber-500" />
                  ))}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed font-normal mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-sm font-bold text-slate-900">{t.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
