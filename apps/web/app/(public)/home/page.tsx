import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { BentoFeatures } from '@/components/landing/BentoFeatures';
import { RoutineShowcase } from '@/components/landing/RoutineShowcase';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { AppDownloadBanner } from '@/components/landing/AppDownloadBanner';
import { FaqAccordion } from '@/components/landing/FaqAccordion';
import { PurpleNewsletterFooter } from '@/components/landing/PurpleNewsletterFooter';

export const metadata: Metadata = {
  title: {
    absolute: 'SAAR — Take Control of Your Daily Habits with AI Coaching',
  },
  description:
    'Track your habits, improve your health and focus, and take control of your growth with AI-powered coaching and data-driven insights.',
  robots: { index: true, follow: true },
};

/**
 * SAAR Master Landing Page (Image 2 Reference Hierarchy):
 * 01 — Pill Navbar with frosted glass
 * 02 — Atmospheric Hero with 4.9 Score & Central High-Fidelity Phone Mockup
 * 03 — Global Media & Trust Strip
 * 04 — Bento Grid: Mint Habit Calendar + Lavender AI Companion Cards
 * 05 — Routine Mastery Split Showcase
 * 06 — 5-Star Builder Testimonials
 * 07 — Dual-Phone App Download Banner
 * 08 — Clean FAQ Accordion
 * 09 — Purple Gradient Newsletter Footer
 */
export default function HomePage() {
  return (
    <main className="overflow-x-hidden min-h-screen bg-[#FAF9FF] text-zinc-900 selection:bg-purple-100 selection:text-purple-900">
      <Navbar />
      <Hero />
      <TrustStrip />
      <BentoFeatures />
      <RoutineShowcase />
      <TestimonialsSection />
      <AppDownloadBanner />
      <FaqAccordion />
      <PurpleNewsletterFooter />
    </main>
  );
}
