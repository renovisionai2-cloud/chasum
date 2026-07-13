import { AiCommandCenter } from "@/components/ai-workforce/command-center";
import { getOrCreateBusiness } from "@/lib/actions/business";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Command Center",
};

export default async function AiCommandCenterPage() {
  await getOrCreateBusiness();
  return <AiCommandCenter />;
}
