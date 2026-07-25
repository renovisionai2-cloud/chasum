import { AiWorkforceSection } from "@/components/landing/ai-workforce-section";
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
import { SummerIntro } from "@/components/landing/summer-intro";
import { TrustSection } from "@/components/landing/trust-section";
import { TrustedPlatform } from "@/components/landing/trusted-platform";
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Chasum | AI Business Operating System for Service Businesses",
  },
  description:
    "Connect scheduling, customers, teams, communication, payments and reporting in one operating platform—with AI assistance designed for service businesses.",
  openGraph: {
    title: "Chasum | AI Business Operating System for Service Businesses",
    description:
      "Connect scheduling, customers, teams, communication, payments and reporting in one operating platform—with AI assistance designed for service businesses.",
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
 * Private Alpha story flow — no fictional social proof; Comparison removed from homepage.
 */
export default function HomePage() {
  return (
    <PageFade>
      <Hero />
      <TrustedPlatform />
      <SummerIntro />
      <PlatformOverview />
      <DashboardShowcase />
      <CustomerJourney />
      <AiWorkforceSection />
      <Industries />
      <TrustSection />
      <PrivateAlphaInvite />
      <Pricing />
      <Faq />
      <CTA />
    </PageFade>
  );
}
