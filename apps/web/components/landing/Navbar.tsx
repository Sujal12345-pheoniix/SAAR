'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Insights', href: '#insights' },
  { label: 'About', href: '#how-it-works' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 40));
  }, [scrollY]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="mx-auto max-w-6xl px-4 sm:px-6"
      >
        <motion.nav
          animate={{
            backgroundColor: scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0)',
            backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
            borderColor: scrolled ? 'rgba(11,16,32,0.08)' : 'rgba(11,16,32,0)',
            marginTop: scrolled ? '12px' : '20px',
            borderRadius: scrolled ? '20px' : '0px',
            boxShadow: scrolled ? '0 4px 24px rgba(11,16,32,0.07)' : 'none',
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.5rem',
            border: '1px solid',
          }}
        >
          {/* Logo */}
          <Link href="/home" style={{ textDecoration: 'none' }}>
            <motion.div
              className="flex items-center gap-2.5"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
                  <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="1" opacity="0.25"/>
                  <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8"/>
                  <circle cx="5" cy="12" r="1.5" fill="white" opacity="0.8"/>
                  <circle cx="12" cy="5" r="1.5" fill="white" opacity="0.8"/>
                </svg>
              </div>
              <span
                className="font-bold text-[1.0625rem] tracking-tight"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                SAAR
              </span>
            </motion.div>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                whileHover={{ color: 'var(--text-primary)', backgroundColor: 'rgba(11,16,32,0.04)' }}
                transition={{ duration: 0.15 }}
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Sign in
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/register"
                className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Get started
              </Link>
            </motion.div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ border: '1px solid var(--border)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block h-[1.5px] w-5 rounded"
                    style={{ background: 'var(--text-primary)' }}
                    animate={mobileOpen ? {
                      rotate: i === 0 ? 45 : i === 2 ? -45 : 0,
                      y: i === 0 ? 7 : i === 2 ? -7 : 0,
                      opacity: i === 1 ? 0 : 1,
                    } : { rotate: 0, y: 0, opacity: 1 }}
                  />
                ))}
              </div>
            </button>
          </div>
        </motion.nav>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={mobileOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          className="md:hidden overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '0 0 20px 20px',
            border: '1px solid var(--border)',
            borderTop: 'none',
          }}
        >
          <div className="px-6 py-4 flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-sm font-medium"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <Link href="/login" className="block py-2.5 text-sm font-medium" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}
