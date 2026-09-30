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
    absolute: 'SAAR — Personal Growth Intelligence & Habit Architecture',
  },
  description:
    'Track your habits, improve your focus, and take control of your long-term growth with data-driven behavioral intelligence.',
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <main className="overflow-x-hidden min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
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
