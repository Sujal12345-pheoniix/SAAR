import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HowSaarThinks } from '@/components/landing/HowSaarThinks';
import { HabitEcosystem } from '@/components/landing/HabitEcosystem';
import { InsightsSection, CtaSection, Footer } from '@/components/landing/InsightsAndFooter';

export const metadata: Metadata = {
  title: 'SAAR — Personal Growth Intelligence',
  description: 'Turn your daily habits, goals, and patterns into a living map of who you\'re becoming. Personal growth intelligence that actually works.',
  robots: { index: true, follow: true },
};

/**
 * SAAR Landing Page — Premium redesign.
 * Full immersive experience: 3D intelligence core, interactive pipeline,
 * radial habit ecosystem, AI insight transformer, CTA.
 */
export default function HomePage() {
  return (
    <main style={{ minHeight: '100dvh' }}>
      <Navbar />
      <Hero />
      <HowSaarThinks />
      <HabitEcosystem />
      <InsightsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
