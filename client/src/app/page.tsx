import Hero from '@/components/landing/Hero';
import Navigation from '@/components/landing/Navigation';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TrustedBy from '@/components/landing/TrustedBy';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SecurityChecksSection from '@/components/landing/SecurityChecksSection';
import ThreatStatsSection from '@/components/landing/ThreatStatsSection';
import AdvantagesSection from '@/components/landing/AdvantagesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CostSavingsSection from '@/components/landing/CostSavingsSection';
import FAQSection from '@/components/landing/FAQSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Navigation />
      <Hero />
      <HowItWorksSection />
      <TrustedBy />
      <FeaturesSection />
      <SecurityChecksSection />
      <ThreatStatsSection />
      <AdvantagesSection />
      <TestimonialsSection />
      <CostSavingsSection />
      <FAQSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
