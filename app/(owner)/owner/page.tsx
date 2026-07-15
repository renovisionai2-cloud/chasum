import { OwnerOverview } from "@/components/owner/overview";
import { getOwnerOverviewMetrics } from "@/lib/owner/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Overview",
};

export default async function OwnerOverviewPage() {
  const metrics = await getOwnerOverviewMetrics();
  return <OwnerOverview metrics={metrics} />;
}
