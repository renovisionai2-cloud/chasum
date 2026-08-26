import { AmbientSection } from "@/components/landing/ambient-background";
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
    "Chasum is not another appointment scheduler. Chasum is an AI Business Operating System for service businesses—with Summer, your AI Business Manager.",
  openGraph: {
    title: "Chasum | AI Business Operating System for Service Businesses",
    description:
      "Chasum is not another appointment scheduler. Chasum is an AI Business Operating System for service businesses—one connected platform, with Summer as your AI Business Manager.",
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
 * Front Door homepage — Living Interface Phase 1 (ambient motion).
 * Platform experience lives at /platform.
 */
export default function HomePage() {
  return (
    <PageFade>
      <div className="fd-home">
        <AmbientSection variant="hero">
          <Hero />
        </AmbientSection>
        <AmbientSection variant="calm">
          <TrustedPlatform />
        </AmbientSection>
        <AmbientSection variant="dawn">
          <SummerIntro />
        </AmbientSection>
        <AmbientSection variant="cool">
          <ConnectedOperatingSystem />
        </AmbientSection>
        <AmbientSection variant="soft">
          <BusinessOutcomes />
        </AmbientSection>
        <AmbientSection variant="warm">
          <HomepageIndustries />
        </AmbientSection>
        <AmbientSection variant="calm">
          <TrustSection />
        </AmbientSection>
        <AmbientSection variant="soft">
          <PrivateAlphaInvite headline="Help shape the future of how service businesses operate." />
        </AmbientSection>
      </div>
    </PageFade>
  );
}
