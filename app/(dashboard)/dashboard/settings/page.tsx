import { SettingsManager } from "@/components/settings/settings-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getBusinessHours } from "@/lib/actions/business-hours";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const business = await getOrCreateBusiness();
  const hours = await getBusinessHours();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your business profile, hours, and booking page."
      />
      <SettingsManager business={business} hours={hours} />
    </div>
  );
}
