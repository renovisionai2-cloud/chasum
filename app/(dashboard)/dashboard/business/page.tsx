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
import { isPlaceholderBusiness } from "@/lib/onboarding/setup-progress";
import type { Holiday } from "@/lib/types/booking";
import type { Metadata } from "next";
import Link from "next/link";

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

  const needsRename = isPlaceholderBusiness(business);

  return (
    <div className="ds-page">
      <PageHeader
        title="Business"
        description="Configure your company profile, hours, booking, branding, notifications, and AI before running Calendar, CRM, and Summer."
      />
      {needsRename ? (
        <div className="mb-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Your public name still looks like a placeholder (
          <strong>{business.name}</strong>
          {business.slug ? (
            <>
              {" "}
              · slug <span className="font-mono">{business.slug}</span>
            </>
          ) : null}
          ). Update <strong>Business name</strong> and{" "}
          <strong>Booking slug</strong> in Profile before sharing your link —
          customers will see these on{" "}
          <Link
            href={`/book/${business.slug}`}
            className="underline underline-offset-2"
            target="_blank"
          >
            /book/{business.slug}
          </Link>
          .
        </div>
      ) : null}
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
