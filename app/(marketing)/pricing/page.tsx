import { Pricing } from "@/components/landing/pricing";
import { PageFade } from "@/components/landing/page-fade";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for every stage of growth. Start free, upgrade when you need more, and run bookings, communication, payments, and operations on one connected platform. Private Alpha.",
};

export default function PricingPage() {
  return (
    <PageFade>
      <Pricing />
    </PageFade>
  );
}
