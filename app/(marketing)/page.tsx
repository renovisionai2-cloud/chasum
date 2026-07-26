import { BusinessOutcomes } from "@/components/landing/business-outcomes";
import { ConnectedOperatingSystem } from "@/components/landing/connected-operating-system";
import { Hero } from "@/components/landing/hero";
import { HomepageIndustries } from "@/components/landing/homepage-industries";
import { PageFade } from "@/components/landing/page-fade";
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
      "Your business already works. Now it can understand itself—scheduling, customers, communication, payments, reporting and AI in one operating system.",
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
 * Front Door homepage — premium AI company launch narrative.
 * Platform experience lives at /platform.
 */
export default function HomePage() {
  return (
    <PageFade>
      <Hero />
      <TrustedPlatform />
      <SummerIntro />
      <ConnectedOperatingSystem />
      <BusinessOutcomes />
      <HomepageIndustries />
      <TrustSection />
      <PrivateAlphaInvite />
    </PageFade>
  );
}
