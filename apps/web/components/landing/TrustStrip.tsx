'use client';

import React from 'react';

const MEDIA_LOGOS = [
  { name: 'TechCrunch', label: 'TechCrunch' },
  { name: 'Forbes', label: 'Forbes' },
  { name: 'Wired', label: 'WIRED' },
  { name: 'FastCompany', label: 'Fast Company' },
  { name: 'Bloomberg', label: 'Bloomberg' },
];

export function TrustStrip() {
  return (
    <section className="py-10 border-y border-purple-100/60 bg-white/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-xs font-semibold text-zinc-400 tracking-wider uppercase text-center md:text-left max-w-xs leading-relaxed">
          As Seen in Global Media & Trusted by Thousands of Mindful Builders
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
          {MEDIA_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="text-base sm:text-lg font-bold tracking-tight text-zinc-600 hover:text-purple-600 transition-colors cursor-default"
            >
              {logo.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
