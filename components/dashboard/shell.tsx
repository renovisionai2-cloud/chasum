"use client";

import { CommandPalette } from "@/components/command-palette/command-palette";
import {
  DashboardSidebar,
  DashboardTopNav,
  MobileSidebar,
} from "@/components/dashboard/sidebar";
import type { LocationScope } from "@/lib/location/constants";
import type { Location, SubscriptionPlan } from "@/lib/types/booking";
import { useState } from "react";

type DashboardShellProps = {
  userEmail?: string;
  locations: Location[];
  locationScope: LocationScope;
  locationQuota: {
    plan: SubscriptionPlan | null;
    currentCount: number;
    canAdd: boolean;
  };
  showHq?: boolean;
  children: React.ReactNode;
};

export function DashboardShell({
  userEmail,
  locations,
  locationScope,
  locationQuota,
  showHq = false,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar
          userEmail={userEmail}
          showHq={showHq}
          className="fixed inset-y-0"
        />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardTopNav
          userEmail={userEmail}
          locations={locations}
          locationScope={locationScope}
          locationQuota={locationQuota}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-7 lg:px-8">{children}</main>
      </div>

      <MobileSidebar
        open={mobileOpen}
        userEmail={userEmail}
        showHq={showHq}
        onClose={() => setMobileOpen(false)}
      />

      <CommandPalette />
    </div>
  );
}
