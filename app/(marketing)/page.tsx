import { AiWorkforceSection } from "@/components/landing/ai-workforce-section";
import { Comparison } from "@/components/landing/comparison";
import { CTA } from "@/components/landing/cta";
import { CustomerJourney } from "@/components/landing/customer-journey";
import { DashboardShowcase } from "@/components/landing/dashboard-showcase";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { ImpactCounters } from "@/components/landing/impact-counters";
import { Industries } from "@/components/landing/industries";
import { LogoCloud } from "@/components/landing/logo-cloud";
import { PageFade } from "@/components/landing/page-fade";
import { PlatformOverview } from "@/components/landing/platform-overview";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustedPlatform } from "@/components/landing/trusted-platform";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Business Operating System for Service Businesses",
  description:
    "Chasum unifies scheduling, CRM, employees, communication, reports, billing, and AI Receptionist — so service businesses run operations and growth in one platform.",
  openGraph: {
    title: "Chasum — Run Your Business. Let AI Handle The Rest.",
    description:
      "The AI Business Operating System built for service businesses. Start free.",
  },
};

export default function HomePage() {
  return (
    <PageFade>
      <Hero />
      <LogoCloud />
      <ImpactCounters />
      <TrustedPlatform />
      <PlatformOverview />
      <DashboardShowcase />
      <Industries />
      <CustomerJourney />
      <AiWorkforceSection />
      <Testimonials />
      <Comparison />
      <Pricing />
      <Faq />
      <CTA />
    </PageFade>
  );
}
