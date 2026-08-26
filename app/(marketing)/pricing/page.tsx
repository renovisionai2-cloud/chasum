import { Pricing } from "@/components/landing/pricing";
import { PageFade } from "@/components/landing/page-fade";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for every stage of growth. Run scheduling, customers, staff, payments, communications, and operations on one AI Business Operating System. Private Alpha.",
};

export default function PricingPage() {
  return (
    <PageFade>
      <Pricing />
    </PageFade>
  );
}
