import { ChaseCrmPanel } from "@/components/crm/chase-crm-panel";
import { CrmManager } from "@/components/crm/crm-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCrmDirectory } from "@/lib/actions/crm";
import { getLocations } from "@/lib/actions/location";
import { getStaff } from "@/lib/actions/staff";
import { getChaseCrmAnalytics } from "@/lib/crm/ai-knowledge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function ClientsPage() {
  const business = await getOrCreateBusiness();
  const [customers, staff, locations, chase] = await Promise.all([
    getCrmDirectory(),
    getStaff(),
    getLocations(),
    getChaseCrmAnalytics(business.id),
  ]);

  return (
    <div className="ds-page space-y-4">
      <PageHeader
        title="Customers"
        description="Customer workspace — who they are, what they booked, what they owe, and what to do next. Search, filter, and open a full profile."
      />
      <ChaseCrmPanel analytics={chase} />
      <CrmManager
        customers={customers}
        staff={staff}
        locations={locations}
        currency={business.currency}
      />
    </div>
  );
}
