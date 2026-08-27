import { RoadmapExperience } from "@/components/landing/roadmap-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "See what is available in Private Alpha, what we're strengthening now, what comes next, and the longer-term direction of the AI Business Operating System.",
};

export default function RoadmapPage() {
  return <RoadmapExperience />;
}
