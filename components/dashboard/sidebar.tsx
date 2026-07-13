"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { DASHBOARD_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import {
  Bell,
  Briefcase,
  Calendar,
  Code,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Repeat,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LocationScope } from "@/lib/location/constants";
import type { Location, SubscriptionPlan } from "@/lib/types/booking";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  users: Users,
  briefcase: Briefcase,
  "user-cog": UserCog,
  bell: Bell,
  plug: Plug,
  repeat: Repeat,
  code: Code,
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
        <Logo href="/dashboard" />
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

export function getPageTitle(pathname: string): string {
  const match = DASHBOARD_NAV.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );
  return match?.label ?? "Dashboard";
}

function UserBadge({ email }: { email?: string }) {
  const initial = email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-foreground">Account</p>
        <p className="max-w-[180px] truncate text-xs text-muted-foreground">
          {email}
        </p>
      </div>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        {initial}
      </div>
    </div>
  );
}

type DashboardTopNavProps = {
  userEmail?: string;
  locations: Location[];
  locationScope: LocationScope;
  locationQuota: {
    plan: SubscriptionPlan | null;
    currentCount: number;
    canAdd: boolean;
  };
  onMenuOpen?: () => void;
};

export function DashboardTopNav({
  userEmail,
  locations,
  locationScope,
  locationQuota,
  onMenuOpen,
}: DashboardTopNavProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 shrink-0 p-0 lg:hidden"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="lg:hidden">
          <Logo showText={false} />
        </div>
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg lg:text-lg">
          {pageTitle}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <LocationSwitcher
          locations={locations}
          scope={locationScope}
          quota={locationQuota}
          className="hidden sm:flex"
        />
        <ThemeToggle />
        <UserBadge email={userEmail} />
      </div>
    </header>
  );
}

type MobileSidebarProps = {
  open: boolean;
  userEmail?: string;
  onClose: () => void;
};

export function MobileSidebar({ open, userEmail, onClose }: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <DashboardSidebar userEmail={userEmail} onNavigate={onClose} />
      </div>
    </div>
  );
}
