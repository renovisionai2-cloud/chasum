import { Pricing } from "@/components/landing/pricing";
import { PageFade } from "@/components/landing/page-fade";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the right stage of growth for your business. Every Chasum plan includes the AI Business Operating System—with transparent capability status during Private Alpha.",
};

export default function PricingPage() {
  return (
    <PageFade>
      <Pricing />
    </PageFade>
  );
}
