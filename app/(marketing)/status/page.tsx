import { StatusExperience } from "@/components/landing/status-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "View the current status of Chasum services and scheduled maintenance. Manually reviewed during Private Alpha.",
};

export default function StatusPage() {
  return <StatusExperience />;
}
