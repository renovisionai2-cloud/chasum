"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { DASHBOARD_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import {
  Banknote,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Code,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Repeat,
  Search,
  Settings,
  Sparkles,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LocationScope } from "@/lib/location/constants";
import type { Location, SubscriptionPlan } from "@/lib/types/booking";

const HQ_NAV_ITEM = {
  href: "/dashboard/hq",
  label: "HQ",
  icon: "crown" as const,
};

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  users: Users,
  banknote: Banknote,
  briefcase: Briefcase,
  "building-2": Building2,
  "user-cog": UserCog,
  "bar-chart-3": BarChart3,
  sparkles: Sparkles,
  bell: Bell,
  plug: Plug,
  repeat: Repeat,
  code: Code,
  settings: Settings,
  crown: Crown,
} as const;

type SidebarProps = {
  userEmail?: string;
  showHq?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function DashboardSidebar({
  userEmail,
  showHq = false,
  className,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = showHq ? [HQ_NAV_ITEM, ...DASHBOARD_NAV] : [...DASHBOARD_NAV];

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-white/10 bg-[#0B1324] text-white",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Logo href="/dashboard" tone="light" priority />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Dashboard">
        {navItems.map((item) => {
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
                "ds-nav-item",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
                item.href === "/dashboard/hq" && !isActive && "text-amber-200/90",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        {userEmail && (
          <div className="rounded-[var(--radius-md)] bg-white/5 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Signed in
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-200">{userEmail}</p>
          </div>
        )}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}

export function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/hq")) return "Chasum HQ";
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
    <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-transparent px-1.5 py-1 transition-colors hover:border-border hover:bg-muted/40">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight text-foreground">Account</p>
        <p className="max-w-[160px] truncate text-[11px] text-muted-foreground">
          {email}
        </p>
      </div>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20"
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
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-xl md:px-6">
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

        <Link
          href="/dashboard/clients"
          className="hidden min-w-0 max-w-xs flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted md:flex lg:max-w-sm ds-focus-ring"
          aria-label="Search clients"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search clients…</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <LocationSwitcher
          locations={locations}
          scope={locationScope}
          quota={locationQuota}
          className="hidden sm:flex"
        />
        <Link href="/dashboard/notifications">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 rounded-xl p-0"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </Link>
        <ThemeToggle />
        <UserBadge email={userEmail} />
      </div>
    </header>
  );
}

type MobileSidebarProps = {
  open: boolean;
  userEmail?: string;
  showHq?: boolean;
  onClose: () => void;
};

export function MobileSidebar({
  open,
  userEmail,
  showHq = false,
  onClose,
}: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 w-[min(100%,16rem)] animate-fade-in-up shadow-lg">
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
        <DashboardSidebar
          userEmail={userEmail}
          showHq={showHq}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
