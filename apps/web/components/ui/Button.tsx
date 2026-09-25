'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  magnetic?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  magnetic = false,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-[10px] text-[0.9375rem]',
    lg: 'px-8 py-3.5 text-base',
  };

  const variantClasses = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    ghost: 'btn btn-ghost',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.25);
    y.set((e.clientY - centerY) * 0.25);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={magnetic ? { x: springX, y: springY } : {}}
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        className={`${variantClasses[variant]} ${sizeClasses[size]} ${className} font-semibold`}
        {...(props as any)}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </motion.button>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}
