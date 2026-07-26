import { DashboardShowcase } from "@/components/landing/dashboard-showcase";
import { PageFade } from "@/components/landing/page-fade";
import { PlatformOverview } from "@/components/landing/platform-overview";
import { PrivateAlphaInvite } from "@/components/landing/private-alpha-invite";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Explore how Chasum connects scheduling, customers, communication, payments, reporting and AI in one operating system for service businesses.",
  openGraph: {
    title: "Chasum Platform",
    description:
      "See how the AI Business Operating System fits together—department by department.",
    images: [{ url: BRAND_ASSETS.ogImage, width: 1200, height: 630, alt: BRAND_NAME }],
  },
};

/**
 * Dedicated Platform experience — previously conflated with the homepage.
 */
export default function PlatformPage() {
  return (
    <PageFade>
      <PlatformOverview />
      <DashboardShowcase />
      <PrivateAlphaInvite />
    </PageFade>
  );
}
