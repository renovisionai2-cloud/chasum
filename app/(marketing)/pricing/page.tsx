import { Pricing } from "@/components/landing/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Alpha Pricing",
  description:
    "Founding pricing with product status made clear. Apply to discuss the right setup for your service business—public self-serve checkout Coming Next.",
};

export default function PricingPage() {
  return <Pricing />;
}
