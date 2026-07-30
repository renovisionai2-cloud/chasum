import { Pricing } from "@/components/landing/pricing";
import { PageFade } from "@/components/landing/page-fade";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One connected platform for growing service businesses. Start with what you need today—then grow into more capacity without changing systems.",
};

export default function PricingPage() {
  return (
    <PageFade>
      <Pricing />
    </PageFade>
  );
}
