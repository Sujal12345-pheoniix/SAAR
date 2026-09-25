'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: boolean;
  hover?: boolean;
}

export function GlassCard({ children, className = '', tilt = false, glow = false, hover = true }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });
  const glowX = useTransform(x, [-0.5, 0.5], ['20%', '80%']);
  const glowY = useTransform(y, [-0.5, 0.5], ['20%', '80%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const motionStyle = tilt
    ? {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d' as const,
        boxShadow: 'var(--shadow-card)',
        borderColor: 'var(--border)',
      }
    : {
        boxShadow: 'var(--shadow-card)',
        borderColor: 'var(--border)',
      };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={motionStyle}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`relative rounded-2xl bg-white border overflow-hidden ${className}`}
    >
      {/* Glow overlay on hover */}
      {glow && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 rounded-2xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(99,102,241,0.06) 0%, transparent 60%)`,
          }}
          whileHover={{ opacity: 1 }}
        />
      )}
      {children}
    </motion.div>
  );
}
