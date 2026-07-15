import { Pricing } from "@/components/landing/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing that grows with your business. Start free. Upgrade only when you're ready.",
};

export default function PricingPage() {
  return <Pricing />;
}
