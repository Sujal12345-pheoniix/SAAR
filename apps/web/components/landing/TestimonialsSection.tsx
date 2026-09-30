'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import React from 'react';

const TESTIMONIALS = [
  {
    name: 'David Allison',
    role: 'Founder & Software Architect',
    avatar: '👨‍💻',
    rating: 5,
    quote:
      'The user interface is intuitive, and the insights I gain from it are invaluable. I feel more in control of my daily focus and well-being than ever before.',
  },
  {
    name: 'Sarah Brown',
    role: 'Design Director',
    avatar: '👩‍🎨',
    rating: 5,
    quote:
      'I’ve tried many habit tracking apps, but this one stands out. The AI truly understands my energy rhythms and offers tailored advice without being intrusive.',
  },
  {
    name: 'Emily Davis',
    role: 'Cognitive Science Researcher',
    avatar: '👩‍🔬',
    rating: 5,
    quote:
      'This app has been a game-changer for me. The daily check-ins and mood tracking help me stay genuinely aware of my mental state and long-term trajectory.',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF9FF] relative">
      <div className="max-w-6xl mx-auto">
        {/* Header matching Image 2 */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
            ))}
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight mb-4">
            What Our Users Say
          </h2>

          <p className="text-sm sm:text-base text-zinc-500 font-normal leading-relaxed">
            See what mindful builders, founders, and researchers have to say about their daily growth with SAAR.
          </p>
        </div>

        {/* 3 Modern Cards matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-7 border border-purple-100/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-zinc-700 leading-relaxed font-normal mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg shadow-inner">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">{t.name}</div>
                  <div className="text-[11px] text-zinc-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
