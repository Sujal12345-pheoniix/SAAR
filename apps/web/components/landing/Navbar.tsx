'use client';

import { motion, useScroll } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Methodology', href: '#methodology' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 20));
  }, [scrollY]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-4 sm:px-6 pt-4 pointer-events-none">
      <div className="w-full max-w-5xl pointer-events-auto">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`flex items-center justify-between px-5 sm:px-7 py-3 rounded-full transition-all duration-300 ${
            scrolled
              ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-purple-500/5 border border-purple-100/80'
              : 'bg-white/75 backdrop-blur-md shadow-sm border border-purple-100/50'
          }`}
        >
          {/* Logo — Pill Brand Badge matching Image 2 */}
          <Link href="/home" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <span className="font-bold text-sm tracking-wider">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-zinc-900 leading-none">
                SAAR
              </span>
              <span className="text-[9px] uppercase tracking-wider text-purple-600/80 font-semibold mt-0.5">
                Habits & Coaching
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-zinc-600 hover:text-purple-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Action Triggers */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-700 hover:text-purple-700 px-3.5 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02]"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-full text-zinc-700 hover:bg-purple-50 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </motion.nav>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden mt-2 p-5 bg-white/95 backdrop-blur-xl rounded-3xl border border-purple-100 shadow-xl flex flex-col gap-3"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-zinc-700 hover:text-purple-600 px-3 py-2 rounded-xl hover:bg-purple-50 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-purple-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-center text-sm font-medium text-zinc-700 py-2.5 rounded-full border border-purple-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="text-center text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-full shadow-md"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
