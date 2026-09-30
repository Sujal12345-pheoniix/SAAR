'use client';

import React from 'react';

const MEDIA_LOGOS = [
  { name: 'TechCrunch', label: 'TechCrunch' },
  { name: 'Forbes', label: 'Forbes' },
  { name: 'WIRED', label: 'WIRED' },
  { name: 'FastCompany', label: 'Fast Company' },
  { name: 'Bloomberg', label: 'Bloomberg' },
];

export function TrustStrip() {
  return (
    <section className="py-14 sm:py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-8">
          As Seen in Global Media &bull; Trusted by Thousands of Mindful Builders
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-75">
          {MEDIA_LOGOS.map((logo) => (
            <span
              key={logo.name}
              className="text-base sm:text-lg font-bold tracking-tight text-slate-800 hover:text-slate-900 transition-colors"
            >
              {logo.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
