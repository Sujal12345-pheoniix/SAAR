'use client';

import React, { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className = '', disabled, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-[#343A40] dark:text-[#CED4DA]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-[#16191F] text-[#0F1115] dark:text-[#FAF8F5] border rounded-md transition-colors placeholder:text-[#868E96] focus:outline-none focus:ring-2 focus:ring-[#226949] dark:focus:ring-[#4ADE80] focus:border-transparent disabled:opacity-50 disabled:bg-[#F5F2EB] dark:disabled:bg-[#1D2129] ${
          error
            ? 'border-[#9B2C2C] focus:ring-[#9B2C2C]'
            : 'border-[rgba(15,17,21,0.14)] dark:border-[rgba(255,255,255,0.14)]'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[#9B2C2C] dark:text-[#F87171] mt-0.5" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-[#868E96] mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
});
