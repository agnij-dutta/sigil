import { Header } from "@/components/ui/header"
import { HeroSection } from "@/components/ui/hero-section"
import { FeaturesSection } from "@/components/ui/features-section"
import { TimelineHowItWorks } from "@/components/ui/timeline-how-it-works"
import { CTASection } from "@/components/ui/cta-section"
import { FooterSection } from "@/components/ui/footer-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <TimelineHowItWorks />
      <CTASection />
      <FooterSection />
    </div>
  );
}
