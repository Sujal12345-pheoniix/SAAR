'use client';

import React from 'react';

export type PulseState = 'idle' | 'listening' | 'reflecting' | 'speaking';

export interface CompanionPulseProps {
  state?: PulseState;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function CompanionPulse({
  state = 'idle',
  size = 40,
  className = '',
  onClick,
}: CompanionPulseProps) {
  const stateColor = {
    idle: '#4D5091',        // Calm reflection indigo
    listening: '#226949',   // Receptive growth green
    reflecting: '#B45309',  // Contemplative amber
    speaking: '#0F766E',    // Grounded recovery teal
  }[state];

  const animationClass = {
    idle: 'animate-pulse duration-[3000ms]',
    listening: 'animate-ping duration-[1800ms]',
    reflecting: 'animate-spin duration-[6000ms]',
    speaking: 'animate-bounce duration-[1500ms]',
  }[state];

  return (
    <div
      role="status"
      aria-label={`Companion state: ${state}`}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ambient wave */}
      <span
        className={`absolute rounded-full opacity-20 ${animationClass}`}
        style={{
          width: size * 1.5,
          height: size * 1.5,
          backgroundColor: stateColor,
        }}
        aria-hidden="true"
      />

      {/* Mid resonance ring */}
      <span
        className="absolute rounded-full opacity-35 transition-all duration-500 ease-out"
        style={{
          width: size * 1.15,
          height: size * 1.15,
          border: `1.5px solid ${stateColor}`,
        }}
        aria-hidden="true"
      />

      {/* Core geometry: Editorial concentric diamond / circle */}
      <div
        className="relative rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 ease-out"
        style={{
          width: size * 0.75,
          height: size * 0.75,
          backgroundColor: stateColor,
        }}
      >
        <div className="w-1.5 h-1.5 bg-[#FAF8F5] rounded-full" />
      </div>
    </div>
  );
}
