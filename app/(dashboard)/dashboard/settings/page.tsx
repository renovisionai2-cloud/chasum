import { SettingsManager } from "@/components/settings/settings-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getAvailabilityBlocks } from "@/lib/actions/availability";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getBusinessHours } from "@/lib/actions/business-hours";
import { getHolidays } from "@/lib/actions/holidays";
import { getStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const business = await getOrCreateBusiness();
  const [hours, holidays, availabilityBlocks, staff] = await Promise.all([
    getBusinessHours(),
    getHolidays(),
    getAvailabilityBlocks(),
    getStaff(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your business profile, hours, and booking page."
      />
      <SettingsManager
        business={business}
        hours={hours}
        holidays={holidays}
        availabilityBlocks={availabilityBlocks}
        staff={staff}
      />
    </div>
  );
}
