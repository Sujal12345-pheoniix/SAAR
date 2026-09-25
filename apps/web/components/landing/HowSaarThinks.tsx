'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { FadeIn } from '@/components/motion/FadeIn';

const PIPELINE_NODES = [
  { id: 0, label: 'Daily Activity', sub: 'Habits · Tasks · Routines', color: '#06B6D4', icon: '📈' },
  { id: 1, label: 'Life Areas', sub: 'Health · Career · Mind · Relationships', color: '#6366F1', icon: '🗺️' },
  { id: 2, label: 'Goal Alignment', sub: 'Future Self · Priorities · Values', color: '#8B5CF6', icon: '🎯' },
  { id: 3, label: 'Pattern Recognition', sub: 'Trends · Correlations · Consistency', color: '#F59E0B', icon: '🧠' },
  { id: 4, label: 'Personal Insight', sub: 'What moves you · What holds you back', color: '#22C55E', icon: '💡' },
  { id: 5, label: 'Aligned Action', sub: 'Prioritized · Contextual · Intentional', color: '#6366F1', icon: '⚡' },
];

function PipelineNode({
  node,
  index,
  active,
  onHover,
}: {
  node: typeof PIPELINE_NODES[0];
  index: number;
  active: boolean;
  onHover: (i: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className="flex items-stretch gap-6 cursor-default"
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <motion.div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 z-10"
          animate={{
            background: active ? node.color : 'rgba(255,255,255,1)',
            boxShadow: active ? `0 0 24px ${node.color}40, 0 4px 12px rgba(11,16,32,0.08)` : '0 1px 4px rgba(11,16,32,0.06)',
            border: `2px solid ${active ? node.color : 'rgba(11,16,32,0.08)'}`,
          }}
          transition={{ duration: 0.3 }}
        >
          {node.icon}
        </motion.div>
        {index < PIPELINE_NODES.length - 1 && (
          <motion.div
            className="w-px flex-1 mt-2"
            style={{ minHeight: 40 }}
            animate={{
              background: active ? `linear-gradient(to bottom, ${node.color}, transparent)` : 'rgba(11,16,32,0.08)',
            }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      {/* Content */}
      <motion.div
        className="pb-8 flex flex-col justify-center"
        animate={{ x: active ? 4 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <p className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {node.label}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{node.sub}</p>
      </motion.div>
    </motion.div>
  );
}

export function HowSaarThinks() {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="py-32 px-6 w-full flex flex-col items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="w-full max-w-6xl mx-auto" style={{ width: '100%', maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>
        <FadeIn className="text-center mb-20 w-full flex flex-col items-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-center" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>
            Intelligence Pipeline
          </p>
          <h2
            className="text-5xl font-bold mb-6 text-center"
            style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}
          >
            How SAAR thinks
          </h2>
          <p className="text-xl max-w-lg mx-auto text-center" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginLeft: 'auto', marginRight: 'auto' }}>
            Every signal you generate becomes part of a living intelligence that helps you grow faster.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start w-full max-w-5xl mx-auto" style={{ width: '100%', maxWidth: '64rem', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Pipeline */}
          <div>
            {PIPELINE_NODES.map((node, i) => (
              <PipelineNode
                key={node.id}
                node={node}
                index={i}
                active={activeNode === i}
                onHover={setActiveNode}
              />
            ))}
          </div>

          {/* Right: animated insight card */}
          <div className="sticky top-32">
            <motion.div
              className="rounded-3xl p-8"
              style={{
                background: 'linear-gradient(145deg, #0B1020 0%, #1a1f3a 100%)',
                boxShadow: '0 20px 60px rgba(11,16,32,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                  Live Intelligence
                </span>
              </div>

              {/* Animated insight output */}
              <motion.div
                key={activeNode ?? 'default'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {activeNode === null && (
                  <>
                    <p className="text-2xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                      Hover the pipeline to see how each layer builds your intelligence.
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                      {['Patterns detected', 'Insights generated', 'Actions prioritized'].map((t) => (
                        <div key={t} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(99,102,241,0.6)' }} />
                          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {activeNode !== null && (
                  <>
                    <div
                      className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                      style={{ background: `${PIPELINE_NODES[activeNode].color}25`, color: PIPELINE_NODES[activeNode].color }}
                    >
                      Layer {activeNode + 1} — {PIPELINE_NODES[activeNode].label}
                    </div>
                    <p className="text-xl font-semibold text-white mb-4" style={{ lineHeight: 1.5, color: '#FFFFFF' }}>
                      {activeNode === 0 && '"You completed 4 out of 5 habits today. Morning sessions had 94% completion."'}
                      {activeNode === 1 && '"Health & Fitness is your highest engagement area this week at 82%."'}
                      {activeNode === 2 && '"Your current actions are 73% aligned with your Future Self identity."'}
                      {activeNode === 3 && '"Your focus drops 40% on days following less than 7 hours of sleep."'}
                      {activeNode === 4 && '"Prioritizing recovery leads to 2x better consistency the following week."'}
                      {activeNode === 5 && '"Schedule tomorrow\'s learning block before 10am for peak alignment."'}
                    </p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: PIPELINE_NODES[activeNode].color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${65 + activeNode * 6}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Confidence: {65 + activeNode * 6}%</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
