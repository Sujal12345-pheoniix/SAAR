'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface SaarLogoProps {
  /**
   * 'mark': only the glowing 3D S symbol
   * 'horizontal': mark on left, modern SAAR wordmark on right
   * 'full': the complete centered 3D artwork badge
   */
  variant?: 'mark' | 'horizontal' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
  subtitle?: boolean;
}

const SIZES = {
  xs: { mark: 24, text: 'text-sm', letter: '-0.02em', gap: 'gap-2' },
  sm: { mark: 32, text: 'text-base', letter: '-0.025em', gap: 'gap-2.5' },
  md: { mark: 40, text: 'text-lg', letter: '-0.03em', gap: 'gap-3' },
  lg: { mark: 48, text: 'text-xl', letter: '-0.03em', gap: 'gap-3.5' },
  xl: { mark: 64, text: 'text-2xl', letter: '-0.035em', gap: 'gap-4' },
};

export function SaarLogo({
  variant = 'horizontal',
  size = 'md',
  showText = true,
  href,
  className = '',
  theme = 'auto',
  subtitle = false,
}: SaarLogoProps) {
  const cfg = SIZES[size];

  const textColor =
    theme === 'dark'
      ? '#FFFFFF'
      : theme === 'light'
      ? '#0B1020'
      : 'var(--text-primary, #0B1020)';

  const content = (
    <div className={`inline-flex items-center ${cfg.gap} ${className}`}>
      {/* 3D Glowing Mark */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden"
        style={{
          width: cfg.mark,
          height: cfg.mark,
          filter: 'drop-shadow(0 2px 8px rgba(99,102,241,0.25))',
        }}
      >
        <Image
          src="/logo-mark.png"
          alt="SAAR Logo"
          width={cfg.mark}
          height={cfg.mark}
          priority
          className="object-contain w-full h-full select-none"
        />
      </div>

      {/* Typography */}
      {variant !== 'mark' && showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`font-black tracking-tight ${cfg.text}`}
            style={{
              color: textColor,
              letterSpacing: cfg.letter,
              fontFamily: 'inherit',
            }}
          >
            SAAR
          </span>
          {subtitle && (
            <span
              className="text-[0.6rem] font-semibold tracking-wider uppercase mt-0.5"
              style={{
                color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary, #9BA3AF)',
                letterSpacing: '0.08em',
              }}
            >
              Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return content;
}
