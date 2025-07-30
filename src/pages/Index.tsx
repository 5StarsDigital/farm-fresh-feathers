import Navigation from '@/components/ui/navigation';
import HeroSection from '@/components/ui/hero-section';
import FeaturesSection from '@/components/ui/features-section';
import HowItWorksSection from '@/components/ui/how-it-works';
import AvailableFarmsSection from '@/components/ui/available-farms-section';
import PackagesSection from '@/components/ui/packages-section';
import AiChickenCoopDesigner from '@/components/ui/ai-chicken-coop-designer';
import TestimonialsSection from '@/components/ui/testimonials-section';
import Footer from '@/components/ui/footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AvailableFarmsSection />
        <PackagesSection />
        <AiChickenCoopDesigner />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
