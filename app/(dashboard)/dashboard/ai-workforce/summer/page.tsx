import { SummerReceptionServerPanel } from "@/components/summer/summer-reception-server";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Summer · AI Receptionist",
};

export default async function SummerReceptionPage() {
  await getOrCreateBusiness();

  return (
    <div className="ds-page">
      <PageHeader
        title="Summer"
        description="AI Receptionist — books and changes appointments through the Booking Engine, answers from real business data, escalates when a human is needed."
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
