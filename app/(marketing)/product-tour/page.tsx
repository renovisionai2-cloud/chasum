import { CustomerJourney } from "@/components/landing/customer-journey";
import { DashboardShowcase } from "@/components/landing/dashboard-showcase";
import { PageFade } from "@/components/landing/page-fade";
import { ProductTourConclusion } from "@/components/landing/product-tour-conclusion";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Tour",
  description:
    "Tour Chasum as an AI Business Operating System—one connected customer journey from booking to payment and reporting, not a standalone scheduler.",
  openGraph: {
    title: "Chasum Product Tour | AI Business Operating System",
    description:
      "One customer journey. One connected record. See how Chasum works as an AI Business Operating System for service businesses.",
    images: [
      { url: BRAND_ASSETS.ogImage, width: 1200, height: 630, alt: BRAND_NAME },
    ],
  },
};

/**
 * Product Tour — verified journey + interactive department previews.
 */
export default function ProductTourPage() {
  return (
    <PageFade>
      <CustomerJourney />
      <DashboardShowcase mode="tour" />
      <ProductTourConclusion />
    </PageFade>
  );
}
