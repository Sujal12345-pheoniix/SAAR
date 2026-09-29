'use client';

import React from 'react';

export type LifeAreaType = 'mind' | 'health' | 'career' | 'relationships' | 'personal' | 'finance' | 'purpose';

interface LifeAreaIconProps {
  area: LifeAreaType | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function LifeAreaIcon({
  area,
  size = 20,
  className = '',
  strokeWidth = 1.75,
  color = 'currentColor',
}: LifeAreaIconProps) {
  const normArea = area.toLowerCase() as LifeAreaType;

  switch (normArea) {
    case 'mind':
      // Lotus / Concentric clarity circles
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9s-9-4.03-9-9a9 9 0 0 1 9-9Z" opacity="0.35" />
          <path d="M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5Z" />
        </svg>
      );

    case 'health':
      // Pulse curve / vitality spiral
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M3 12h4l3-7 4 14 3-7h4" />
          <circle cx="12" cy="12" r="9" opacity="0.25" />
        </svg>
      );

    case 'career':
      // Architectural pillar / deliberate trajectory compass
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="m3 21 18-18" />
          <path d="M9 3h12v12" />
          <path d="M4 11v10h10" opacity="0.35" />
        </svg>
      );

    case 'relationships':
      // Two intersecting resonant circles / organic connection
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <circle cx="9" cy="12" r="6" />
          <circle cx="15" cy="12" r="6" />
        </svg>
      );

    case 'personal':
      // Solitary pebble / reflective horizon
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
        </svg>
      );

    case 'finance':
      // Balanced scale / calibrated reserve
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );

    case 'purpose':
    default:
      // Star of direction / internal north
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}
