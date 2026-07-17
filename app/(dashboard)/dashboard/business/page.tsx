import { BusinessHub } from "@/components/business/business-hub";
import { PageHeader } from "@/components/ui/page-header";
import { getBookingResources } from "@/lib/actions/booking-engine";
import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  listAutomationRules,
  listBusinessClosures,
  listBusinessDocuments,
  listDiscountCodes,
  listFormTemplates,
  listGiftCards,
  listMemberships,
  listPackages,
  listServiceCategories,
  listTaxRates,
} from "@/lib/actions/business-management";
import { getHolidays } from "@/lib/actions/holidays";
import { getLocationHours, getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import type { Holiday } from "@/lib/types/booking";
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
    hours,
    holidays,
    closures,
    documents,
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
    getLocationHours(),
    getHolidays().catch(() => [] as Holiday[]),
    listBusinessClosures(),
    listBusinessDocuments(),
  ]);

  return (
    <div className="ds-page">
      <PageHeader
        title="Business"
        description="Configure your company profile, hours, booking, branding, notifications, and AI before running Calendar, CRM, and Summer."
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
        hours={hours}
        holidays={holidays}
        closures={closures}
        documents={documents}
      />
    </div>
  );
}
