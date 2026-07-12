"use client";

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
  children: React.ReactNode;
};

export function DashboardShell({
  userEmail,
  locations,
  locationScope,
  locationQuota,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar userEmail={userEmail} className="fixed inset-y-0" />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardTopNav
          userEmail={userEmail}
          locations={locations}
          locationScope={locationScope}
          locationQuota={locationQuota}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      <MobileSidebar
        open={mobileOpen}
        userEmail={userEmail}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}
