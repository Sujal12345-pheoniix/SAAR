'use client';

import { motion, useScroll } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Becoming', href: '#becoming' },
  { label: 'Life Intelligence', href: '#life-intelligence' },
  { label: 'How SAAR Thinks', href: '#how-it-thinks' },
  { label: 'Trade-offs', href: '#tradeoffs' },
  { label: 'Growth Story', href: '#growth-story' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 30));
  }, [scrollY]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <motion.nav
          animate={{
            backgroundColor: scrolled ? 'rgba(250, 248, 245, 0.92)' : 'rgba(250, 248, 245, 0.65)',
            backdropFilter: scrolled ? 'blur(16px)' : 'blur(8px)',
            borderColor: scrolled ? 'rgba(15, 17, 21, 0.08)' : 'rgba(15, 17, 21, 0.04)',
            boxShadow: scrolled ? '0 4px 20px rgba(15, 17, 21, 0.04)' : 'none',
            marginTop: scrolled ? '12px' : '18px',
          }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between px-6 py-3.5 rounded-2xl border transition-all"
        >
          {/* Logo — Editorial Typography */}
          <Link href="/home" className="inline-flex items-center gap-2.5 text-decoration-none group">
            <div className="w-7 h-7 rounded-lg bg-[#0F1115] text-[#FAF8F5] flex items-center justify-center font-editorial font-semibold text-base transition-transform group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl font-bold tracking-tight text-[#0F1115] leading-none">
                SAAR
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#868E96] font-medium mt-0.5">
                Growth Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#495057] hover:text-[#0F1115] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Action Triggers */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#495057] hover:text-[#0F1115] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#226949] hover:bg-[#1B543A] text-white transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
            >
              Begin Journey
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[#0F1115] hover:bg-[#F5F2EB] transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </motion.nav>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 p-5 rounded-2xl bg-[#FAF8F5] border border-[rgba(15,17,21,0.08)] shadow-lg flex flex-col gap-4"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-[#495057] hover:text-[#0F1115] py-1"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-[rgba(15,17,21,0.06)]" />
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-center py-2 text-sm font-medium text-[#495057]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="text-center py-2.5 rounded-xl text-sm font-medium bg-[#226949] text-white"
              >
                Begin Journey
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
