import { Pricing } from "@/components/landing/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Founding pricing for Chasum design partners. Apply for Private Alpha — public self-serve checkout Coming Next.",
};

export default function PricingPage() {
  return <Pricing />;
}
