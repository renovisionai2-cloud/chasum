import { PaymentsDashboard } from "@/components/commerce/payments-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { loadCommerceDashboard } from "@/lib/actions/commerce";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function PaymentsPage() {
  await getOrCreateBusiness();
  const snapshot = await loadCommerceDashboard();

  return (
    <div className="ds-page">
      <PageHeader
        title="Payments"
        description="Commerce Platform — invoices, receipts, deposits, and refunds across bookings and CRM. Card data never stored."
      />
      <PaymentsDashboard snapshot={snapshot} />
    </div>
  );
}
