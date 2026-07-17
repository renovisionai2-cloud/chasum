import { ServicesManager } from "@/components/services/services-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { listServiceCategories } from "@/lib/actions/business-management";
import { getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
};

export default async function ServicesPage() {
  await getOrCreateBusiness();
  const [services, categories, staff, locations] = await Promise.all([
    getServices(),
    listServiceCategories(),
    getStaff(),
    getLocations(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Catalog, categories, pricing, and assignment — the source of truth for everything customers can book."
      />
      <ServicesManager
        services={services}
        categories={categories}
        staff={staff}
        locations={locations}
      />
    </div>
  );
}
