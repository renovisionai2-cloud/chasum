import { HqWorkspace } from "@/components/hq/hq-workspace";
import { getHqSnapshot } from "@/lib/hq/snapshot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chasum HQ",
  description: "Founder operating system — internal only.",
};

export default async function HqPage() {
  const snapshot = await getHqSnapshot();
  return <HqWorkspace snapshot={snapshot} />;
}
