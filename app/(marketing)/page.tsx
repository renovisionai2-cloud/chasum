import { BusinessOutcomes } from "@/components/landing/business-outcomes";
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
    "Businesses don’t need more software. They need software that understands how the business works. Chasum is the AI Business Operating System for service businesses.",
  openGraph: {
    title: "Chasum | AI Business Operating System for Service Businesses",
    description:
      "Your business already works. Now it can understand itself—with scheduling, customers, communication, payments, reporting and AI in one operating system.",
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
 * Homepage — Chasum Identity narrative (Sprint 2).
 * Curiosity → understanding → trust → action.
 */
export default function HomePage() {
  return (
    <PageFade>
      <Hero />
      <TrustedPlatform />
      <SummerIntro />
      <PlatformOverview />
      <BusinessOutcomes />
      <Industries />
      <TrustSection />
      <Pricing />
      <PrivateAlphaInvite />
    </PageFade>
  );
}
