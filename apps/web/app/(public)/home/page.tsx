import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { LifeIntelligenceMap } from '@/components/landing/LifeIntelligenceMap';
import { HowSaarThinks } from '@/components/landing/HowSaarThinks';
import { PlannerSimulator } from '@/components/landing/PlannerSimulator';
import { GrowthStorySection } from '@/components/landing/GrowthStorySection';
import { CompanionSection } from '@/components/landing/CompanionSection';
import { CtaSection, Footer } from '@/components/landing/InsightsAndFooter';

export const metadata: Metadata = {
  title: {
    absolute: 'SAAR — Personal Growth Intelligence',
  },
  description:
    'You are not managing tasks. You are understanding the person behind the tasks. Turn your daily reality into a deliberate path toward who you want to become.',
  robots: { index: true, follow: true },
};

/**
 * SAAR Ultimate Editorial Home Page.
 * Grounded hierarchy:
 * 01 — Who Am I Becoming? (Hero & Becoming Field)
 * 02 — What Is Happening In My Life? (Interactive Life Intelligence Map)
 * 03 — What Does SAAR Notice? (Human Transformation Stories & Evidence)
 * 04 — What Should I Do Next? (Adaptive Planning & Capacity Simulator)
 * 05 — What Changed? (Your Story of Change — Monthly Retrospective)
 * 06 — Grounded Companion (The SAAR Pulse & Action Confirmation)
 * 07 — Calm Invitation & Footnote
 */
export default function HomePage() {
  return (
    <main className="overflow-x-hidden min-h-screen bg-[#FAF8F5] text-[#0F1115]">
      <Navbar />
      <Hero />
      <LifeIntelligenceMap />
      <HowSaarThinks />
      <PlannerSimulator />
      <GrowthStorySection />
      <CompanionSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
