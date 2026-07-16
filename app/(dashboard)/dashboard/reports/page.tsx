import { ReportsHub } from "@/components/reports/reports-hub";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getReportsBundle } from "@/lib/actions/reports";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  await getOrCreateBusiness();
  const bundle = await getReportsBundle();

  return (
    <div className="ds-page">
      <PageHeader
        title="Reports"
        description="Reports & Analytics — executive KPIs, revenue, appointments, customers, employees, locations, and financial intelligence."
      />
      <ReportsHub bundle={bundle} />
    </div>
  );
}
