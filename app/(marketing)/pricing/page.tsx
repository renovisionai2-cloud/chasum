import { Pricing } from "@/components/landing/pricing";
import { PageFade } from "@/components/landing/page-fade";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Built for growing service businesses that want fewer missed appointments, clearer customer communication, and one place to run the day.",
};

export default function PricingPage() {
  return (
    <PageFade>
      <Pricing />
    </PageFade>
  );
}
