import { SummerReceptionServerPanel } from "@/components/summer/summer-reception-server";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Summer · AI Business Manager",
};

export default async function SummerReceptionPage() {
  await getOrCreateBusiness();

  return (
    <div className="ds-page">
      <PageHeader
        title="Summer"
        description="Summer — AI Business Manager. Books and changes appointments through the Booking Engine, answers from real business data, and escalates when a human is needed."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Starting Summer…</p>
        }
      >
        <SummerReceptionServerPanel />
      </Suspense>
    </div>
  );
}
