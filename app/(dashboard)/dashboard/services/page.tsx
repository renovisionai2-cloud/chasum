import { ServicesManager } from "@/components/services/services-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { listServiceCategories } from "@/lib/actions/business-management";
import { getLocations, getLocationScope } from "@/lib/actions/location";
import { getOperatorServiceCatalog } from "@/lib/actions/services";
import { getStaffForAssignment } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
};

export default async function ServicesPage() {
  await getOrCreateBusiness();
  const [services, categories, staff, locations, scope] = await Promise.all([
    getOperatorServiceCatalog(),
    listServiceCategories(),
    getStaffForAssignment(),
    getLocations(),
    getLocationScope(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Catalog, categories, pricing, and assignment — the source of truth for everything customers can book."
      />
      <ServicesManager
        services={services}
        selectedLocationId={scope.mode === "single" ? scope.locationId : null}
        categories={categories}
        staff={staff}
        locations={locations}
      />
    </div>
  );
}
