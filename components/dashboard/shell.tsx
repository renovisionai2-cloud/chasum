"use client";

import {
  DashboardSidebar,
  DashboardTopNav,
  MobileSidebar,
} from "@/components/dashboard/sidebar";
import { useState } from "react";

type DashboardShellProps = {
  userEmail?: string;
  children: React.ReactNode;
};

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar userEmail={userEmail} className="fixed inset-y-0" />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardTopNav
          userEmail={userEmail}
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
