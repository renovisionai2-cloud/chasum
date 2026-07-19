import { PaymentsDashboard } from "@/components/commerce/payments-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { loadCommerceDashboard } from "@/lib/actions/commerce";
import { getCrmDirectory } from "@/lib/actions/crm";
import { displayCustomerName } from "@/lib/crm/display";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; appointment?: string }>;
}) {
  await getOrCreateBusiness();
  const params = await searchParams;
  const [snapshot, directory] = await Promise.all([
    loadCommerceDashboard(),
    getCrmDirectory(),
  ]);

  const customers = directory.map((c) => ({
    id: c.id,
    label: displayCustomerName(c),
  }));

  return (
    <div className="ds-page">
      <PageHeader
        title="Payments"
        description="Record cash and card payments, generate invoices, and track outstanding balances."
      />
      <PaymentsDashboard
        snapshot={snapshot}
        customers={customers}
        initialCustomerId={params.customer ?? ""}
        initialAppointmentId={params.appointment ?? ""}
      />
    </div>
  );
}
