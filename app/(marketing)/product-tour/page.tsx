import { CustomerJourney } from "@/components/landing/customer-journey";
import { DashboardShowcase } from "@/components/landing/dashboard-showcase";
import { PageFade } from "@/components/landing/page-fade";
import { PrivateAlphaInvite } from "@/components/landing/private-alpha-invite";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Tour",
  description:
    "Follow one connected customer journey through Chasum—from booking to payment and reporting.",
  openGraph: {
    title: "Chasum Product Tour",
    description:
      "One customer journey. One connected record. Explore how Chasum works.",
    images: [{ url: BRAND_ASSETS.ogImage, width: 1200, height: 630, alt: BRAND_NAME }],
  },
};

/**
 * Product Tour — verified journey + interactive department previews.
 */
export default function ProductTourPage() {
  return (
    <PageFade>
      <CustomerJourney />
      <DashboardShowcase />
      <PrivateAlphaInvite />
    </PageFade>
  );
}
