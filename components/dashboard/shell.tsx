"use client";

import { CommandPalette } from "@/components/command-palette/command-palette";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import {
  DashboardSidebar,
  DashboardTopNav,
  MobileSidebar,
} from "@/components/dashboard/sidebar";
import { isWidePortalPath } from "@/lib/dashboard/nav";
import type { LocationScope } from "@/lib/location/constants";
import type { Location, SubscriptionPlan } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

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

function ShellInner({
  userEmail,
  locations,
  locationScope,
  locationQuota,
  showHq = false,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const wide = isWidePortalPath(pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar
          userEmail={userEmail}
          showHq={showHq}
          className="fixed inset-y-0"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardTopNav
          userEmail={userEmail}
          locations={locations}
          locationScope={locationScope}
          locationQuota={locationQuota}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main
          className={cn(
            "flex-1 px-4 py-5 pb-24 md:px-6 md:py-7 lg:px-8 lg:pb-7",
            wide ? "w-full max-w-none" : "mx-auto w-full max-w-6xl",
          )}
        >
          {children}
        </main>
      </div>

      <MobileSidebar
        open={mobileOpen}
        userEmail={userEmail}
        showHq={showHq}
        onClose={() => setMobileOpen(false)}
      />

      <MobileBottomNav onMore={() => setMobileOpen(true)} />

      <CommandPalette />
    </div>
  );
}

/**
 * Suspense boundary required for useSearchParams in nav chrome.
 */
export function DashboardShell(props: DashboardShellProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-background">
          <div className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0B1324] lg:block" />
          <div className="flex-1" />
        </div>
      }
    >
      <ShellInner {...props} />
    </Suspense>
  );
}
