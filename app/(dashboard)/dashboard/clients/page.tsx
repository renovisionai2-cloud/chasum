import { CrmManager } from "@/components/crm/crm-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCrmDirectory } from "@/lib/actions/crm";
import { getLocations } from "@/lib/actions/location";
import { getStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM",
};

export default async function ClientsPage() {
  await getOrCreateBusiness();
  const [customers, staff, locations] = await Promise.all([
    getCrmDirectory(),
    getStaff(),
    getLocations(),
  ]);

  return (
    <div className="ds-page">
      <PageHeader
        title="CRM"
        description="Customer Relationship Management — directory, profiles, timeline, communication, and insights."
      />
      <CrmManager customers={customers} staff={staff} locations={locations} />
    </div>
  );
}
