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
  showDeveloper?: boolean;
  children: React.ReactNode;
};

function ShellInner({
  userEmail,
  locations,
  locationScope,
  locationQuota,
  showHq = false,
  showDeveloper = false,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const wide = isWidePortalPath(pathname);

  return (
    <div className="flex min-h-screen bg-background print:min-h-0">
      <a
        href="#portal-main"
        className="sr-only print:hidden focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[calc(var(--z-palette)+1)] focus:rounded-[var(--radius-md)] focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md ds-focus-ring"
      >
        Skip to main content
      </a>

      <div className="hidden lg:block print:hidden">
        <DashboardSidebar
          userEmail={userEmail}
          showHq={showHq}
          showDeveloper={showDeveloper}
          className="fixed inset-y-0"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
        <div className="print:hidden">
        <DashboardTopNav
          userEmail={userEmail}
          locations={locations}
          locationScope={locationScope}
          locationQuota={locationQuota}
          onMenuOpen={() => setMobileOpen(true)}
        />
        </div>
        <main
          id="portal-main"
          tabIndex={-1}
          className={cn(
            "flex-1 px-4 py-5 pb-24 md:px-6 md:py-7 lg:px-8 lg:pb-7 print:p-0 print:pb-0",
            wide ? "w-full max-w-none" : "mx-auto w-full max-w-6xl",
          )}
        >
          {children}
        </main>
      </div>

      <div className="print:hidden">
      <MobileSidebar
        open={mobileOpen}
        userEmail={userEmail}
        showHq={showHq}
        showDeveloper={showDeveloper}
        onClose={() => setMobileOpen(false)}
      />

      <MobileBottomNav onMore={() => setMobileOpen(true)} />

      <CommandPalette />
      </div>
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
        <div className="flex min-h-screen bg-background print:min-h-0">
          <div className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0B1324] lg:block" />
          <div className="flex-1" />
        </div>
      }
    >
      <ShellInner {...props} />
    </Suspense>
  );
}
