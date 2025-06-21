import { Header } from "@/components/ui/header"
import { HeroSection } from "@/components/ui/hero-section"
import { FeaturesSection } from "@/components/ui/features-section"
import { HowItWorksSection } from "@/components/ui/how-it-works-section"
import { CTASection } from "@/components/ui/cta-section"
import { FooterSection } from "@/components/ui/footer-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
