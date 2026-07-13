import { PublicBookingPage } from "@/components/booking/public-booking-page";
import { getBusinessBySlug } from "@/lib/actions/business";
import {
  getPublicLocationBySlug,
  getPublicLocations,
} from "@/lib/actions/location";
import { getPublicServices } from "@/lib/actions/services";
import { getPublicStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ location?: string }>;
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
  const { location: locationSlug } = await searchParams;
  const business = await getBusinessBySlug(slug);

  if (!business) notFound();

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
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{business.name}</h1>
          {selectedLocation && locations.length > 1 && (
            <p className="mt-1 text-muted-foreground">{selectedLocation.name}</p>
          )}
          <p className="mt-2 text-muted-foreground">
            Online booking is not available yet. Please check back soon.
          </p>
        </div>
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
    />
  );
}
