import { PrivateAlphaExperience } from "@/components/landing/private-alpha-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Private Alpha",
  description:
    "Help shape the AI Business Operating System with Chasum. Design Partners get early access, personal onboarding, and a real voice in our priorities.",
};

export default function WhyPrivateAlphaPage() {
  return <PrivateAlphaExperience />;
}
