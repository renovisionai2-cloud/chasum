import { CustomerProfileView } from "@/components/crm/customer-profile";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { listMemberships } from "@/lib/actions/business-management";
import { loadCustomerCommerceAccount } from "@/lib/actions/commerce";
import { displayCustomerName, loadCrmCustomerProfile } from "@/lib/actions/crm";
import { getCustomers } from "@/lib/actions/customers";
import { getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import type {
  Customer,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatLocationAddress(location: {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
} | null | undefined): string | null {
  if (!location) return null;
  const parts = [
    location.address_line1,
    location.address_line2,
    [location.city, location.state].filter(Boolean).join(", "),
    location.postal_code,
  ].filter((part) => Boolean(part && String(part).trim()));
  return parts.length > 0 ? parts.join(", ") : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await loadCrmCustomerProfile(id);
  return {
    title: profile
      ? `${displayCustomerName(profile.customer)} · CRM`
      : "Customer · CRM",
  };
}

export default async function CustomerProfilePage({ params }: PageProps) {
  const { id } = await params;
  await getOrCreateBusiness();
  const [profile, staff, locations, services, customers, memberships, commerceAccount] =
    await Promise.all([
      loadCrmCustomerProfile(id),
      getStaff(),
      getLocations(),
      getServices(),
      getCustomers(),
      listMemberships(),
      loadCustomerCommerceAccount(id),
    ]);

  if (!profile) notFound();

  const preferredLocationFromHistory = profile.appointments.all.find(
    (appt) => appt.location?.name === profile.insights.preferredLocationName,
  )?.location as
    | {
        address_line1?: string | null;
        address_line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
      }
    | undefined;

  const mapsAddress =
    profile.customer.address?.trim() ||
    formatLocationAddress(preferredLocationFromHistory);

  return (
    <div className="ds-page">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/clients" className="mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label="Back to CRM"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Customer profile"
          description="Source of truth — timeline, bookings, notes, documents, and Chase signals."
        />
      </div>
      <CustomerProfileView
        profile={profile}
        staff={staff as StaffWithServices[]}
        locations={locations}
        services={services as Service[]}
        customers={(customers ?? []) as Customer[]}
        memberships={memberships}
        mapsAddress={mapsAddress}
        commerceAccount={commerceAccount}
      />
    </div>
  );
}
