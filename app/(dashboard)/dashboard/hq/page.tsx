import { HqWorkspace } from "@/components/hq/hq-workspace";
import { getHqSnapshot } from "@/lib/hq/snapshot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Admin",
  description: "SaaS control plane — internal only. Not the Chasum HQ tenant.",
};

export default async function HqPage() {
  const snapshot = await getHqSnapshot();
  return <HqWorkspace snapshot={snapshot} />;
}
