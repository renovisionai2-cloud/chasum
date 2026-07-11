import { PublicBookingPage } from "@/components/booking/public-booking-page";
import { getBusinessBySlug } from "@/lib/actions/business";
import { getPublicBusinessHours } from "@/lib/actions/business-hours";
import { getPublicServices } from "@/lib/actions/services";
import { getPublicStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: "Not Found" };
  return {
    title: `Book with ${business.name}`,
    description: `Schedule an appointment with ${business.name} on Chasum.`,
  };
}

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) notFound();

  const [services, staff, hours] = await Promise.all([
    getPublicServices(business.id),
    getPublicStaff(business.id),
    getPublicBusinessHours(business.id),
  ]);

  if (services.length === 0 || staff.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{business.name}</h1>
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
      services={services}
      staff={staff}
      hours={hours}
    />
  );
}
