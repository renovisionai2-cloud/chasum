"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { DASHBOARD_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  users: Users,
  settings: Settings,
} as const;

type SidebarProps = {
  userEmail?: string;
  className?: string;
  onNavigate?: () => void;
};

export function DashboardSidebar({
  userEmail,
  className,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {DASHBOARD_NAV.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        {userEmail && (
          <p className="mb-3 truncate px-3 text-xs text-muted-foreground">
            {userEmail}
          </p>
        )}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}

export function DashboardHeader({ userEmail }: { userEmail?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 lg:hidden">
        <Logo showText={false} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <div className="absolute right-3 top-3 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <DashboardSidebar
              userEmail={userEmail}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function DashboardDesktopHeader() {
  return (
    <header className="hidden h-16 items-center justify-end gap-2 border-b border-border bg-card px-6 lg:flex">
      <ThemeToggle />
    </header>
  );
}
