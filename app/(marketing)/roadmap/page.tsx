import { RoadmapExperience } from "@/components/landing/roadmap-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "See what Chasum offers business owners today, what’s coming next, and where we’re taking the AI Business Operating System.",
};

export default function RoadmapPage() {
  return <RoadmapExperience />;
}
