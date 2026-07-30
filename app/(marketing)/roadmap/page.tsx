import { RoadmapExperience } from "@/components/landing/roadmap-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Roadmap",
  description:
    "See what Chasum offers today, what we're refining with Private Alpha partners, and the long-term vision for the AI Business Operating System.",
};

export default function RoadmapPage() {
  return <RoadmapExperience />;
}
