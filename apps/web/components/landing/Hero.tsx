'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { IntelligenceCoreLoader } from '@/components/3d/IntelligenceCoreLoader';

/* ---- Background particles (pure CSS) ---- */
function BackgroundParticles() {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: 'rgba(99,102,241,0.4)',
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ---- Subtle grid ---- */
function GridBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 70%)',
      }}
    />
  );
}

/* ---- Stat pill ---- */
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      className="inline-flex flex-col items-center px-5 py-3 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 2px 12px rgba(11,16,32,0.06)',
      }}
      whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(11,16,32,0.1)' }}
    >
      <span className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</span>
      <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </motion.div>
  );
}

export function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const heroRef = useRef<HTMLElement>(null);

  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.width / 2) / rect.width);
      mouseY.set((e.clientY - rect.height / 2) / rect.height);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden hero-bg"
      style={{ paddingTop: '100px' }}
    >
      <GridBackground />
      <BackgroundParticles />

      {/* Radial glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 65%)',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          x: smoothX,
          y: smoothY,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-100px)]">

          {/* ---- LEFT: Copy ---- */}
          <div className="flex flex-col gap-8 lg:pr-8">

            {/* Badge */}
            <motion.div
              className="inline-flex w-fit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(99,102,241,0.16)',
                  letterSpacing: '0.06em',
                }}
              >
                <Sparkles size={12} />
                Personal Growth Intelligence
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1
                className="text-6xl xl:text-7xl font-bold leading-none"
                style={{ letterSpacing: '-0.035em', color: 'var(--text-primary)' }}
              >
                Your life.
                <br />
                <span className="gradient-text">Decoded.</span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              className="text-xl leading-relaxed max-w-md"
              style={{ color: 'var(--text-secondary)' }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              SAAR turns your daily habits, goals, and patterns into a living map of who you&apos;re becoming — and what to do next.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap gap-4 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl text-white font-semibold text-base"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.35), 0 1px 3px rgba(99,102,241,0.2)',
                    textDecoration: 'none',
                  }}
                >
                  Start understanding yourself
                  <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base"
                  style={{
                    color: 'var(--text-primary)',
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(11,16,32,0.1)',
                    boxShadow: '0 1px 4px rgba(11,16,32,0.06)',
                    textDecoration: 'none',
                  }}
                >
                  See how it works
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="flex flex-wrap gap-4 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <StatPill value="7 Areas" label="of Life Tracked" />
              <StatPill value="Daily" label="Growth Session" />
              <StatPill value="Real-time" label="Alignment Score" />
            </motion.div>
          </div>

          {/* ---- RIGHT: 3D Intelligence Core ---- */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center"
            style={{ height: '580px' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Atmospheric glow behind 3D */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 65%)',
              }}
            />
            <IntelligenceCoreLoader />

            {/* Floating info cards */}
            <motion.div
              className="absolute top-12 -left-8 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 4px 20px rgba(11,16,32,0.08)',
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
                  <span style={{ fontSize: '14px' }}>🔥</span>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>14-day streak</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Morning focus</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-20 -right-8 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 4px 20px rgba(11,16,32,0.08)',
              }}
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: '14px' }}>⚡</span>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>87% aligned</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Life momentum</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute top-1/3 -right-4 px-3 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 4px 20px rgba(11,16,32,0.08)',
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>New insight</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}>
          Scroll to explore
        </span>
        <motion.div
          className="w-5 h-8 rounded-full border-2 flex items-start justify-center p-1"
          style={{ borderColor: 'rgba(11,16,32,0.15)' }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent)' }}
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
