'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'growth';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  href?: string;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0F1115] text-[#FAF8F5] hover:bg-[#1D2129] active:bg-[#272C37] shadow-sm border border-transparent dark:bg-[#FAF8F5] dark:text-[#0F1115] dark:hover:bg-[#EFECE4]',
  secondary:
    'bg-[#F5F2EB] text-[#0F1115] hover:bg-[#EFECE4] active:bg-[#E5E1D7] border border-[rgba(15,17,21,0.08)] dark:bg-[#1D2129] dark:text-[#FAF8F5] dark:border-[rgba(255,255,255,0.12)]',
  outline:
    'bg-transparent text-[#0F1115] hover:bg-[rgba(15,17,21,0.04)] border border-[rgba(15,17,21,0.18)] dark:text-[#FAF8F5] dark:border-[rgba(255,255,255,0.2)] dark:hover:bg-[rgba(255,255,255,0.06)]',
  ghost:
    'bg-transparent text-[#343A40] hover:text-[#0F1115] hover:bg-[rgba(15,17,21,0.05)] dark:text-[#CED4DA] dark:hover:text-[#FAF8F5] dark:hover:bg-[rgba(255,255,255,0.06)]',
  danger:
    'bg-[#9B2C2C] text-white hover:bg-[#822727] active:bg-[#681E1E] shadow-sm border border-transparent dark:bg-[#F87171] dark:text-[#0F1115] dark:hover:bg-[#EF4444]',
  growth:
    'bg-[#226949] text-white hover:bg-[#1A543A] active:bg-[#133F2B] shadow-sm border border-transparent dark:bg-[#4ADE80] dark:text-[#0F1115] dark:hover:bg-[#22C55E]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-md gap-2',
  lg: 'px-6 py-2.5 text-base font-medium rounded-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    href,
    children,
    className = '',
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  const baseClasses =
    'inline-flex items-center justify-center transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226949] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const combinedClasses = `${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  const inner = (
    <>
      {isLoading && (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClasses} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {inner}
    </button>
  );
});
