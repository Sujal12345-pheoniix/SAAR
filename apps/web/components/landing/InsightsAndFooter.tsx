'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center">
      <div className="rounded-3xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.08)] p-10 sm:p-16 shadow-sm relative overflow-hidden">
        {/* Subtle Ambient Radial */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none opacity-40 blur-3xl rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(34,105,73,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#226949] bg-[rgba(34,105,73,0.08)]">
            A New Standard In Personal Growth
          </div>

          <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#0F1115] tracking-tight leading-tight">
            Start understanding the person <br />
            <span className="italic font-normal text-[#226949]">taking shape behind your days.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#495057] leading-relaxed font-interface">
            No gamified dopamine loops. No hollow streak counters. Only quiet, honest intelligence that honors who you are and where you are going.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-base bg-[#226949] hover:bg-[#1B543A] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <span>Begin Journey</span>
              <ArrowRight size={17} />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-base bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#0F1115] border border-[rgba(15,17,21,0.1)] transition-all shadow-sm hover:-translate-y-0.5"
            >
              Sign In to Your Space
            </Link>
          </div>

          <div className="pt-6 flex items-center justify-center gap-6 text-xs text-[#868E96]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#226949]" /> Privacy First
            </span>
            <span>•</span>
            <span>Zero Advertising</span>
            <span>•</span>
            <span>Private Personal Data</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[rgba(15,17,21,0.06)] py-12 px-4 sm:px-6 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#0F1115] text-[#FAF8F5] flex items-center justify-center font-editorial font-bold text-xs">
              S
            </div>
            <span className="font-editorial text-lg font-bold text-[#0F1115]">SAAR</span>
          </div>
          <p className="text-xs text-[#868E96] mt-1 max-w-sm">
            Personal growth intelligence grounded in human behavioral evidence.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-[#495057]">
          <Link href="/privacy" className="hover:text-[#0F1115] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-[#0F1115] transition-colors">
            Terms of Service
          </Link>
          <a href="#how-it-thinks" className="hover:text-[#0F1115] transition-colors">
            How SAAR Thinks
          </a>
          <a href="#becoming" className="hover:text-[#0F1115] transition-colors">
            Becoming
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-[#868E96]">
          © {new Date().getFullYear()} SAAR. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function InsightsSection() {
  // Retained export signature for backward compatibility, mapped to internal sections
  return null;
}
