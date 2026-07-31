import { PrivateAlphaExperience } from "@/components/landing/private-alpha-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Private Alpha",
  description:
    "Join Chasum as a design partner. Help build the future of business management with early access, personal onboarding, and real influence on the product.",
};

export default function WhyPrivateAlphaPage() {
  return <PrivateAlphaExperience />;
}
