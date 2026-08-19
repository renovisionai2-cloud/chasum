"use client";

import { Logo } from "@/components/brand/logo";
import { BusinessSwitcher, type BusinessSwitcherItem } from "@/components/dashboard/business-switcher";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { QuickCreateMenu } from "@/components/dashboard/quick-create-menu";
import { UserAccountMenu } from "@/components/dashboard/user-account-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  DASHBOARD_NAV_GROUPS,
  HQ_NAV_ITEM,
  getPageTitle,
  isNavItemActive,
  type DashboardNavIcon,
  type DashboardNavItem,
} from "@/lib/dashboard/nav";
import type { LocationScope } from "@/lib/location/constants";
import type { Location, SubscriptionPlan } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import {
  Banknote,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Code,
  Crown,
  LayoutDashboard,
  Menu,
  Package,
  Plug,
  Repeat,
  Settings,
  Sparkles,
  Sun,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export { getPageTitle };

function initialAdvancedOpen(pathname: string): boolean {
  return pathname.startsWith("/dashboard/developer");
}

const iconMap: Record<DashboardNavIcon, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  users: Users,
  banknote: Banknote,
  briefcase: Briefcase,
  package: Package,
  "building-2": Building2,
  "user-cog": UserCog,
  "bar-chart-3": BarChart3,
  sparkles: Sparkles,
  sun: Sun,
  bell: Bell,
  plug: Plug,
  repeat: Repeat,
  code: Code,
  settings: Settings,
  crown: Crown,
};

function NavLink({
  item,
  pathname,
  search,
  onNavigate,
}: {
  item: DashboardNavItem;
  pathname: string;
  search: string;
  onNavigate?: () => void;
}) {
  const Icon = iconMap[item.icon];
  const isActive = isNavItemActive(pathname, search, item);

  return (
    <Link
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
      {isActive ? (
        <span
          className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}

type SidebarProps = {
  userEmail?: string;
  showHq?: boolean;
  showDeveloper?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function DashboardSidebar({
  showHq = false,
  showDeveloper = false,
  className,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    initialAdvancedOpen(pathname),
  );
  const developerActive = pathname.startsWith("/dashboard/developer");
  const advancedExpanded = advancedOpen || developerActive;

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

      <nav
        className="flex-1 space-y-4 overflow-y-auto p-3"
        aria-label="Portal"
      >
        {showHq ? (
          <div className="space-y-0.5">
            <NavLink
              item={HQ_NAV_ITEM}
              pathname={pathname}
              search={search}
              onNavigate={onNavigate}
            />
          </div>
        ) : null}

        {DASHBOARD_NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => {
            if (item.href === "/dashboard/developer" && !showDeveloper) {
              return false;
            }
            return true;
          });
          if (items.length === 0) return null;

          const collapsed = group.defaultCollapsed && !advancedExpanded;
          const isAdvanced = group.id === "advanced";

          return (
            <div key={group.id} className="space-y-1">
              {group.label ? (
                isAdvanced ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-300 ds-focus-ring"
                    aria-expanded={advancedExpanded}
                    onClick={() => setAdvancedOpen((v) => !v)}
                  >
                    {group.label}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-[var(--duration-fast)]",
                        advancedExpanded && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {group.label}
                  </p>
                )
              ) : null}

              {!collapsed ? (
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavLink
                      key={`${item.href}-${item.label}`}
                      item={item}
                      pathname={pathname}
                      search={search}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/dashboard/ai-workforce/summer"
          onClick={onNavigate}
          className="flex min-h-[var(--touch-min)] flex-col gap-0.5 rounded-[var(--radius-md)] bg-white/5 px-3 py-2.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white ds-focus-ring"
          aria-label="Ask Summer, AI Business Manager, Early Access"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Sun className="h-4 w-4 text-amber-200" aria-hidden="true" />
            Ask Summer
          </span>
          <span className="pl-6 text-[10px] font-medium text-slate-400">
            AI Business Manager · Early Access
          </span>
        </Link>
      </div>
    </aside>
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
  authorizedBusinesses?: BusinessSwitcherItem[];
  activeBusinessId?: string;
  onMenuOpen?: () => void;
};

export function DashboardTopNav({
  userEmail,
  locations,
  locationScope,
  locationQuota,
  authorizedBusinesses = [],
  activeBusinessId = "",
  onMenuOpen,
}: DashboardTopNavProps) {
  return (
    <header className="sticky top-0 z-[var(--z-shell)] flex h-16 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 shrink-0 p-0 lg:hidden"
          onClick={onMenuOpen}
          aria-label="Open menu"
          aria-controls="portal-mobile-nav"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="lg:hidden">
          <Logo showText={false} />
        </div>

        <CommandTrigger className="hidden md:flex" />
        <CommandTrigger compact className="md:hidden" />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <QuickCreateMenu />
        <BusinessSwitcher
          businesses={authorizedBusinesses}
          activeBusinessId={activeBusinessId}
        />
        <LocationSwitcher
          locations={locations}
          scope={locationScope}
          quota={locationQuota}
          className="hidden sm:flex"
        />
        <Link
          href="/dashboard/ai-workforce/summer"
          className="hidden h-10 min-h-[var(--touch-min)] items-center gap-1.5 rounded-[var(--radius-md)] px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:inline-flex ds-focus-ring"
          aria-label="Summer, AI Business Manager, Early Access"
          title="Summer — AI Business Manager (Early Access)"
        >
          <Sun className="h-4 w-4 text-primary" aria-hidden="true" />
          Summer
        </Link>
        <Link href="/dashboard/notifications">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-10 w-10 rounded-xl p-0"
            aria-label="Communications"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </Link>
        <ThemeToggle />
        <UserAccountMenu email={userEmail} />
      </div>
    </header>
  );
}

type MobileSidebarProps = {
  open: boolean;
  userEmail?: string;
  showHq?: boolean;
  showDeveloper?: boolean;
  onClose: () => void;
};

export function MobileSidebar({
  open,
  showHq = false,
  showDeveloper = false,
  onClose,
}: MobileSidebarProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden" id="portal-mobile-nav">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Portal navigation"
        className="absolute inset-y-0 left-0 w-[min(100%,16rem)] shadow-lg motion-safe:animate-fade-in-up"
      >
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <DashboardSidebar
          showHq={showHq}
          showDeveloper={showDeveloper}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
