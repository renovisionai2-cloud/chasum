import { AiWorkforceDashboard } from "@/components/ai-workforce/workforce-dashboard";
import { getOrCreateBusiness } from "@/lib/actions/business";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Workforce",
  description: "Manage your Chasum AI employees and Command Center.",
};

export default async function AiWorkforcePage() {
  await getOrCreateBusiness();
  return <AiWorkforceDashboard />;
}
