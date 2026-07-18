import { ChaseOpsServerPanel } from "@/components/chase/chase-ops-server";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Chase · Operations Manager",
};

export default async function ChaseOpsPage() {
  await getOrCreateBusiness();

  return (
    <div className="ds-page">
      <PageHeader
        title="Chase"
        description="AI Operations Manager — monitors performance, surfaces grounded recommendations, and never changes your business data."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading Chase…</p>
        }
      >
        <ChaseOpsServerPanel />
      </Suspense>
    </div>
  );
}
