import { BusinessHub } from "@/components/business/business-hub";
import { PageHeader } from "@/components/ui/page-header";
import { getBookingResources } from "@/lib/actions/booking-engine";
import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  listAutomationRules,
  listDiscountCodes,
  listFormTemplates,
  listGiftCards,
  listMemberships,
  listPackages,
  listServiceCategories,
  listTaxRates,
} from "@/lib/actions/business-management";
import { getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business",
};

export default async function BusinessPage() {
  const business = await getOrCreateBusiness();
  const [
    locations,
    services,
    categories,
    resources,
    memberships,
    packages,
    giftCards,
    taxRates,
    discounts,
    forms,
    automationRules,
  ] = await Promise.all([
    getLocations(),
    getServices(),
    listServiceCategories(),
    getBookingResources(),
    listMemberships(),
    listPackages(),
    listGiftCards(),
    listTaxRates(),
    listDiscountCodes(),
    listFormTemplates(),
    listAutomationRules(),
  ]);

  return (
    <div className="ds-page">
      <PageHeader
        title="Business"
        description="Business Management — profile, locations, catalog, commerce, hours, forms, and automation for every location and tenant."
      />
      <BusinessHub
        business={business}
        locations={locations}
        services={services}
        categories={categories}
        resources={resources}
        memberships={memberships}
        packages={packages}
        giftCards={giftCards}
        taxRates={taxRates}
        discounts={discounts}
        forms={forms}
        automationRules={automationRules}
      />
    </div>
  );
}
