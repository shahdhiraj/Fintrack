import HeroSection from '@/components/hero/hero-section';
import ServicesSection from '@/components/hero/services-section';
import ReviewsSection from '@/components/hero/reviews-section';
import ContactSection, { CtaBand } from '@/components/hero/contact-section';
import SiteFooter from '@/components/hero/site-footer';

export default function HeroPage() {
  return (
    <main id="top" className="min-h-screen bg-[#000000] scroll-smooth">
      <HeroSection />
      <ServicesSection />
      <ReviewsSection />
      <CtaBand />
      <ContactSection />
      <SiteFooter />
    </main>
  );
}
