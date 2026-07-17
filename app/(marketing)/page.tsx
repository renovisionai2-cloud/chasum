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
    title: "Chasum — Run your business. Let AI handle the rest.",
    description:
      "The AI Business Operating System built for service businesses. Start free.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chasum — AI Business Operating System",
      },
    ],
  },
};

/**
 * V3 story flow:
 * Meet Chasum → Trust → One OS → Real Product → Connected Journey →
 * AI Workforce → Real Businesses → Real Results → Compare → Pricing → Start
 */
export default function HomePage() {
  return (
    <PageFade>
      <Hero />
      <LogoCloud />
      <TrustedPlatform />
      <ImpactCounters />
      <PlatformOverview />
      <DashboardShowcase />
      <CustomerJourney />
      <AiWorkforceSection />
      <Industries />
      <Testimonials />
      <Comparison />
      <Pricing />
      <Faq />
      <CTA />
    </PageFade>
  );
}
