import { PublicBookingPage } from "@/components/booking/public-booking-page";
import { BusinessContact } from "@/components/booking/business-contact";
import { getBusinessBySlug } from "@/lib/actions/business";
import {
  getPublicLocationBySlug,
  getPublicLocations,
} from "@/lib/actions/location";
import { getPublicServices } from "@/lib/actions/services";
import { getPublicStaff } from "@/lib/actions/staff";
import {
  isPublicBookingAllowed,
  publicBookingBlockedMessage,
} from "@/lib/booking/access";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ location?: string; invite?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: "Not Found" };
  return {
    title: `Book with ${business.name}`,
    description:
      business.description?.trim() ||
      `Schedule an appointment with ${business.name} on Chasum.`,
  };
}

export default async function BookPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { location: locationSlug, invite } = await searchParams;
  const business = await getBusinessBySlug(slug);

  if (!business) notFound();

  if (!isPublicBookingAllowed(business, invite)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold">{business.name}</h1>
            <p className="mt-3 text-muted-foreground">
              {publicBookingBlockedMessage(business)}
            </p>
            {(business.phone || business.email) && (
              <p className="mt-4 text-sm text-muted-foreground">
                {business.phone && <>Phone: {business.phone}</>}
                {business.phone && business.email && " · "}
                {business.email && <>Email: {business.email}</>}
              </p>
            )}
          </div>
        </div>
        <BusinessContact business={business} className="border-t border-border" />
      </div>
    );
  }

  const locations = await getPublicLocations(business.id);
  if (locations.length === 0) notFound();

  const selectedLocation = locationSlug
    ? await getPublicLocationBySlug(business.id, locationSlug)
    : locations.find((l) => l.is_default) ?? locations[0];

  const locationId = selectedLocation?.id;

  const [services, staff] = await Promise.all([
    getPublicServices(business.id),
    getPublicStaff(business.id),
  ]);

  if (services.length === 0 || staff.length === 0) {
    const missing: string[] = [];
    if (services.length === 0) missing.push("at least one service");
    if (staff.length === 0) missing.push("at least one bookable employee");

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold">{business.name}</h1>
            {selectedLocation && locations.length > 1 && (
              <p className="mt-1 text-muted-foreground">{selectedLocation.name}</p>
            )}
            <p className="mt-3 text-muted-foreground">
              Online booking is not available yet. This business still needs{" "}
              {missing.join(" and ")} before customers can book.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              If you operate this business, finish setup in Chasum — add a
              service and an employee (or add yourself as the provider), then
              return here.
            </p>
          </div>
        </div>
        <BusinessContact business={business} className="border-t border-border" />
      </div>
    );
  }

  return (
    <PublicBookingPage
      business={business}
      locations={locations}
      initialLocationId={locationId}
      services={services}
      staff={staff}
      inviteCode={invite}
    />
  );
}
