'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const IntelligenceCore = dynamic(
  () => import('./IntelligenceCore').then((m) => ({ default: m.IntelligenceCore })),
  { ssr: false, loading: () => <FallbackOrb /> }
);

function FallbackOrb() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <div
          className="w-56 h-56 rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 80px rgba(99,102,241,0.25)',
          }}
        />
        {/* Orbital rings CSS fallback */}
        {[60, 90, 115].map((r, i) => (
          <div
            key={r}
            className="absolute top-1/2 left-1/2 border rounded-full"
            style={{
              width: r * 2,
              height: r * 2,
              marginTop: -r,
              marginLeft: -r,
              borderColor: `rgba(99,102,241,${0.35 - i * 0.08})`,
              transform: `rotateX(${60 + i * 15}deg)`,
              animation: `spin ${12 + i * 4}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
            }}
          />
        ))}
        <div
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: 56,
            height: 56,
            marginTop: -28,
            marginLeft: -28,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            boxShadow: '0 0 30px rgba(99,102,241,0.5)',
          }}
        />
      </div>
    </div>
  );
}

export function IntelligenceCoreLoader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
      className="w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      <IntelligenceCore mouseX={mouse.x} mouseY={mouse.y} />
    </motion.div>
  );
}
