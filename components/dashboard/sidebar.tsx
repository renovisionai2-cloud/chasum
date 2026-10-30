"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { MobileWorkspaceScope } from "@/components/dashboard/mobile-workspace-scope";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import {
  DASHBOARD_NAV_GROUPS,
  HQ_NAV_ITEM,
  getPageTitle,
  isNavItemActive,
  type DashboardNavIcon,
  type DashboardNavItem,
} from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import type { LocationScope } from "@/lib/location/constants";
import type { Location, SubscriptionPlan } from "@/lib/types/booking";
import {
  Activity,
  Banknote,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Code,
  Crown,
  Gift,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Percent,
  Plug,
  Repeat,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";

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
  gift: Gift,
  percent: Percent,
  "map-pin": MapPin,
  wallet: Wallet,
  activity: Activity,
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
  const accessibleName = item.badge
    ? `${item.label}, ${item.badge}`
    : item.label;

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
      aria-label={accessibleName}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto shrink-0 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200 ring-1 ring-white/30">
          {item.badge}
        </span>
      ) : isActive ? (
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
  userEmail,
  showHq = false,
  showDeveloper = true,
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

      <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Dashboard">
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

      <div className="space-y-2 border-t border-white/10 p-3">
        <Link
          href="/dashboard/ai-workforce/summer"
          onClick={onNavigate}
          className="flex flex-col gap-0.5 rounded-[var(--radius-md)] bg-white/5 px-3 py-2.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white ds-focus-ring"
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

// Observe the canonical form's lifecycle without wrapping or replacing its action.
function AccountSignOut({ submitting, release }: { submitting: boolean; release: () => void }) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) release();
    wasPending.current = pending;
  }, [pending, release]);
  return (
    <>
      <Button type="submit" disabled={submitting || pending} className="min-h-11 w-full gap-2">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {submitting || pending ? "Signing out…" : "Sign out"}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {submitting || pending ? "Signing out. Please wait…" : ""}
      </p>
    </>
  );
}

function AccountControl({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const claimed = useRef(false);
  const accountForm = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const release = useCallback(() => {
    claimed.current = false;
    setSubmitting(false);
  }, []);
  useEffect(() => {
    const containPendingFocus = (event: KeyboardEvent) => {
      // The unchanged Sheet includes disabled controls in its Tab endpoints.
      // While submitting, Close is the Account panel's only enabled endpoint.
      if (claimed.current && event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        accountForm.current?.closest('[role="dialog"]')
          ?.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", containPendingFocus, true);
    return () => document.removeEventListener("keydown", containPendingFocus, true);
  }, []);
  const initial = email?.charAt(0).toUpperCase() ?? "?";
  const close = useCallback(() => {
    // Keep this form mounted while pending so its lifecycle and guard cannot
    // be reset by closing/reopening the panel. The Auth action is unchanged.
    if (claimed.current) return;
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="ds-focus-ring flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 rounded-[var(--radius-md)] border border-transparent px-1.5 py-1 transition-colors hover:border-border hover:bg-muted/40 touch-manipulation"
        aria-label={email ? `Account, signed in as ${email}` : "Account"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="hidden text-right md:block">
          <span className="block text-sm font-medium leading-tight text-foreground">Account</span>
          <span className="block max-w-[160px] truncate text-[11px] text-muted-foreground">
            {email}
          </span>
        </span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20"
          aria-hidden="true"
        >
          {initial}
        </span>
      </button>
      {/* Escape the header's backdrop-filter containing block and stacking context. */}
      {open && createPortal(
        <Sheet open={open} onClose={close} title="Account" className="md:max-w-sm">
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="break-all text-sm font-medium text-foreground">
                {email || "Signed-in account identity is unavailable."}
              </p>
            </div>
            <form ref={accountForm} action={signOut} onPointerDownCapture={(event) => {
              // A second pointer press must not blur focus onto a disabled submit.
              if (claimed.current) event.preventDefault();
            }} onSubmit={(event) => {
              // Claim synchronously: a second submit in the same event turn
              // must not get ahead of React's pending render.
              if (claimed.current) {
                event.preventDefault();
                return;
              }
              claimed.current = true;
              setSubmitting(true);
              event.currentTarget.closest('[role="dialog"]')
                ?.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.focus({ preventScroll: true });
            }}>
              <AccountSignOut submitting={submitting} release={release} />
            </form>
          </div>
        </Sheet>, document.body,
      )}
    </>
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
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/85 px-3 backdrop-blur-xl sm:gap-3 sm:px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 shrink-0 p-0 lg:hidden"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="shrink-0 lg:hidden">
          <Logo showText={false} />
        </div>
        <MobileWorkspaceScope locations={locations} scope={locationScope} />

        <Link
          href="/dashboard/clients"
          className="hidden min-w-0 max-w-xs flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted md:flex lg:max-w-sm ds-focus-ring"
          aria-label="Search clients"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search clients…</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-0 sm:gap-2">
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
            aria-label="Communications"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </Link>
        <ThemeToggle />
        <AccountControl email={userEmail} />
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
  userEmail,
  showHq = false,
  showDeveloper = true,
  onClose,
}: MobileSidebarProps) {
  const layer = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    // Safari touch activation need not focus a button. Record either existing
    // trigger before the unchanged shell opens this drawer.
    const rememberTrigger = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(
        'button[aria-label="Open menu"], button[aria-label="More navigation"]',
      ) : null;
      if (target) opener.current = target;
    };
    document.addEventListener("click", rememberTrigger, true);
    return () => document.removeEventListener("click", rememberTrigger, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = opener.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    const inertSiblings: Array<[HTMLElement, boolean]> = [];
    // Isolate only this modal's background, preserving existing inert values.
    let branch: HTMLElement | null = layer.current;
    while (branch?.parentElement) {
      const parent: HTMLElement = branch.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          inertSiblings.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      if (parent === document.body) break;
      branch = parent;
    }
    document.body.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => element.tabIndex >= 0 && !element.closest('[hidden], [inert]') && getComputedStyle(element).display !== "none");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0], last = items[items.length - 1];
        if (!first || !last) { event.preventDefault(); return; }
        if (!panel.current?.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus({ preventScroll: true });
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) closeButton.current?.focus({ preventScroll: true });
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", containFocus);
    desktop.addEventListener("change", onResize);
    onResize();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", containFocus);
      desktop.removeEventListener("change", onResize);
      for (const [element, previous] of inertSiblings) element.inert = previous;
      document.body.style.overflow = previousOverflow;
      opener.current = null;
      // A mobile trigger disappears at desktop widths; use the visible Account
      // trigger instead of restoring focus to a hidden control.
      const target = desktop.matches
        ? document.querySelector<HTMLElement>('button[aria-label^="Account"][aria-haspopup="dialog"]')
        : previousFocus;
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div ref={layer} className="fixed inset-x-0 top-0 z-[55] h-screen supports-[height:100dvh]:h-dvh lg:hidden" id="portal-mobile-nav">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard navigation"
        className="absolute inset-y-0 left-0 w-[min(100%,16rem)] animate-fade-in-up shadow-lg"
      >
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-slate-200 hover:bg-white/10 hover:text-white focus-visible:ring-white"
            onClick={onClose}
            aria-label="Close menu"
            ref={closeButton}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <DashboardSidebar
          userEmail={userEmail}
          showHq={showHq}
          showDeveloper={showDeveloper}
          onNavigate={onClose}
          className="min-h-0 w-full pb-[env(safe-area-inset-bottom)] [&>div]:shrink-0 [&>nav]:min-h-0"
        />
      </div>
    </div>
  );
}
