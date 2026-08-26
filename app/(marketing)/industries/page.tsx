import { Industries } from "@/components/landing/industries";
import { PageFade } from "@/components/landing/page-fade";
import { PrivateAlphaInvite } from "@/components/landing/private-alpha-invite";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import { INDUSTRIES_ALPHA_HEADLINE } from "@/lib/marketing/industries-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "One Chasum platform for service businesses—an AI Business Operating System configured around how healthcare, beauty, fitness, home services, automotive, legal, and other operators actually work.",
  openGraph: {
    title: "Chasum for Service Businesses | AI Business Operating System",
    description:
      "One platform. Different configuration by industry. Chasum is the AI Business Operating System for service businesses.",
    images: [{ url: BRAND_ASSETS.ogImage, width: 1200, height: 630, alt: BRAND_NAME }],
  },
};

/**
 * Dedicated industries experience.
 */
export default function IndustriesPage() {
  return (
    <PageFade>
      <Industries />
      <PrivateAlphaInvite headline={INDUSTRIES_ALPHA_HEADLINE} />
    </PageFade>
  );
}
