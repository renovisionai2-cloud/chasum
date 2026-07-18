import { AiWorkforceSection } from "@/components/landing/ai-workforce-section";
import { Comparison } from "@/components/landing/comparison";
import { CTA } from "@/components/landing/cta";
import { CustomerJourney } from "@/components/landing/customer-journey";
import { DashboardShowcase } from "@/components/landing/dashboard-showcase";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { Industries } from "@/components/landing/industries";
import { PageFade } from "@/components/landing/page-fade";
import { PlatformOverview } from "@/components/landing/platform-overview";
import { Pricing } from "@/components/landing/pricing";
import { PrivateAlphaInvite } from "@/components/landing/private-alpha-invite";
import { TrustedPlatform } from "@/components/landing/trusted-platform";
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Business Operating System for Service Businesses",
  description:
    "Chasum unifies scheduling, CRM, employees, communication, reports, and Early Access AI (Summer & Chase). Private Alpha for design partners.",
  openGraph: {
    title: "Chasum — Run your business. Let AI handle the rest.",
    description:
      "The AI Business Operating System built for service businesses. Apply for Private Alpha.",
    images: [
      {
        url: BRAND_ASSETS.ogImage,
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
      },
    ],
  },
};

/**
 * Private Alpha story flow — no fictional social proof.
 */
export default function HomePage() {
  return (
    <PageFade>
      <Hero />
      <TrustedPlatform />
      <PlatformOverview />
      <DashboardShowcase />
      <CustomerJourney />
      <AiWorkforceSection />
      <Industries />
      <PrivateAlphaInvite />
      <Comparison />
      <Pricing />
      <Faq />
      <CTA />
    </PageFade>
  );
}
