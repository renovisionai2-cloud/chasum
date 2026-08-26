import { DashboardShowcase } from "@/components/landing/dashboard-showcase";
import { PageFade } from "@/components/landing/page-fade";
import { PlatformConclusion } from "@/components/landing/platform-conclusion";
import { PlatformOverview } from "@/components/landing/platform-overview";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "The AI Business Operating System for Service Businesses. See how scheduling, customers, staff, payments, communications, reporting, automation, and AI share one Business Brain.",
  openGraph: {
    title: "Chasum Platform | AI Business Operating System",
    description:
      "One intelligent operating system—scheduling, customers, staff, payments, communications, reporting, automation, and AI share one Business Brain.",
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
      <DashboardShowcase mode="platform" />
      <PlatformConclusion />
    </PageFade>
  );
}
