import { SettingsManager } from "@/components/settings/settings-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getAvailabilityBlocks } from "@/lib/actions/availability";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getHolidays } from "@/lib/actions/holidays";
import {
  getLocationScope,
  getLocationWithSettings,
} from "@/lib/actions/location";
import { getStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const business = await getOrCreateBusiness();
  const [location, locationScope, holidays, availabilityBlocks, staff] =
    await Promise.all([
      getLocationWithSettings(),
      getLocationScope(),
      getHolidays(),
      getAvailabilityBlocks(),
      getStaff(),
    ]);

  if (!location) {
    throw new Error("No location configured for this business.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your business profile, location hours, and booking page."
      />
      <SettingsManager
        business={business}
        location={location}
        locationScope={locationScope}
        holidays={holidays}
        availabilityBlocks={availabilityBlocks}
        staff={staff}
      />
    </div>
  );
}
