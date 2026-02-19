import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import PricingSection from "@/components/landing/PricingSection";
import AboutSection from "@/components/landing/AboutSection";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <WorkflowSection />
      <FeaturesSection />
      <ComparisonSection />
      <PricingSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </main>
  );
}
