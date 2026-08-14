import { PaymentsDashboard } from "@/components/commerce/payments-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  loadAppointmentLabels,
  loadCommerceDashboard,
  loadOutstandingQueues,
} from "@/lib/actions/commerce";
import { getCrmDirectory } from "@/lib/actions/crm";
import { displayCustomerName } from "@/lib/crm/display";
import type { Customer } from "@/lib/types/booking";
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
  const [snapshot, directory, queues] = await Promise.all([
    loadCommerceDashboard(),
    getCrmDirectory(),
    loadOutstandingQueues(),
  ]);

  const customers = directory.map((c) => ({
    id: c.id,
    label: displayCustomerName(c),
  }));

  const seedCustomers = directory.map((c) => ({
    id: c.id,
    business_id: c.business_id,
    name: displayCustomerName(c),
    email: c.email ?? "",
    phone: c.phone ?? null,
    notes: null,
    tags: [],
    referral_source: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as Customer[];

  const appointmentIds = [
    ...snapshot.recentTransactions.map((tx) => tx.appointmentId ?? ""),
    ...snapshot.openInvoices.map((inv) => inv.appointmentId ?? ""),
  ];
  const appointmentLabels = await loadAppointmentLabels(appointmentIds);

  return (
    <div className="ds-page">
      <PageHeader
        title="Payments"
        description="Customer → appointment → payment. Collect balances, deposits, and refunds from one operating surface."
      />
      <PaymentsDashboard
        snapshot={snapshot}
        customers={customers}
        seedCustomers={seedCustomers}
        initialCustomerId={params.customer ?? ""}
        initialAppointmentId={params.appointment ?? ""}
        outstandingBalances={queues.balances}
        outstandingDeposits={queues.deposits}
        appointmentLabels={appointmentLabels}
      />
    </div>
  );
}
