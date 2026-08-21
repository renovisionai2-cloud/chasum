import { Industries } from "@/components/landing/industries";
import { PageFade } from "@/components/landing/page-fade";
import { PrivateAlphaInvite } from "@/components/landing/private-alpha-invite";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Chasum provides a connected operating foundation that can be configured around how each service business actually works.",
  openGraph: {
    title: "Chasum for Service Businesses",
    description:
      "Explore how Chasum supports healthcare, beauty, fitness, home services, automotive, legal services, and more.",
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
      <PrivateAlphaInvite />
    </PageFade>
  );
}
