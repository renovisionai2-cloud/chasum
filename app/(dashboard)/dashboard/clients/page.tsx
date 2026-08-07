import { CustomerOverviewPanel } from "@/components/crm/customer-overview-panel";
import { CrmManager } from "@/components/crm/crm-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCrmDirectory } from "@/lib/actions/crm";
import { getLocations } from "@/lib/actions/location";
import { getStaff } from "@/lib/actions/staff";
import { buildCustomerHealthSummary } from "@/lib/crm/customer-health";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function ClientsPage() {
  const business = await getOrCreateBusiness();
  const [customers, staff, locations] = await Promise.all([
    getCrmDirectory(),
    getStaff(),
    getLocations(),
  ]);

  const health = buildCustomerHealthSummary(customers);

  return (
    <div className="ds-page space-y-4">
      <PageHeader
        title="Customers"
        description="Customer workspace — who they are, what they booked, what they owe, and what to do next."
      />
      <CustomerOverviewPanel health={health} />
      <CrmManager
        customers={customers}
        staff={staff}
        locations={locations}
        currency={business.currency}
      />
    </div>
  );
}
