import { ReportsHub } from "@/components/reports/reports-hub";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getReportsBundle } from "@/lib/actions/reports";
import { formatStaffFacingInstant } from "@/lib/business/datetime";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const business = await getOrCreateBusiness();
  const bundle = await getReportsBundle();
  const asOf = formatStaffFacingInstant(
    bundle.snapshot.generatedAt,
    business.timezone,
  );

  return (
    <div className="ds-page">
      <PageHeader
        title="Reports"
        description={`As of ${asOf} (business time). Figures refresh on the next visit after a booking or payment — this page does not poll.`}
      />
      <ReportsHub bundle={bundle} />
    </div>
  );
}
