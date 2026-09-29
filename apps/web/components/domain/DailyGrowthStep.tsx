'use client';

import React, { type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface DailyGrowthStepProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  className?: string;
}

export function DailyGrowthStep({
  currentStep,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onPrevious,
  isSubmitting = false,
  nextLabel,
  className = '',
}: DailyGrowthStepProps) {
  const isLast = currentStep === totalSteps;

  return (
    <Card variant="default" padding="lg" className={`flex flex-col gap-6 max-w-2xl mx-auto ${className}`}>
      {/* Progress Breadcrumb */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-[#4D5091] dark:text-[#818CF8] font-semibold">
          Daily Growth Reflection • Step {currentStep} of {totalSteps}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === currentStep
                  ? 'w-6 bg-[#4D5091] dark:bg-[#818CF8]'
                  : i + 1 < currentStep
                  ? 'w-2 bg-[#226949] dark:bg-[#4ADE80]'
                  : 'w-2 bg-[#EFECE4] dark:bg-[#272C37]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5] leading-tight">
          {title}
        </h2>
        <p className="text-sm text-[#868E96] mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Step Body */}
      <div className="min-h-[160px] flex flex-col justify-center">
        {children}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
        <div>
          {currentStep > 1 && onPrevious && (
            <Button variant="ghost" size="sm" onClick={onPrevious} disabled={isSubmitting}>
              Previous
            </Button>
          )}
        </div>
        <div>
          {onNext && (
            <Button
              variant={isLast ? 'growth' : 'primary'}
              size="md"
              onClick={onNext}
              isLoading={isSubmitting}
            >
              {nextLabel || (isLast ? 'Complete Reflection' : 'Continue')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
