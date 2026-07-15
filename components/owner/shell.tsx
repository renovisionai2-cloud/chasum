"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { OWNER_NAV, type OwnerNavIcon } from "@/lib/owner/constants";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import {
  Activity,
  Building2,
  Clock,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const iconMap: Record<OwnerNavIcon, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  building: Building2,
  "credit-card": CreditCard,
  dollar: DollarSign,
  clock: Clock,
  "life-buoy": LifeBuoy,
  activity: Activity,
  shield: Shield,
  settings: Settings,
};

function OwnerNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {OWNER_NAV.map((item) => {
        const Icon = iconMap[item.icon];
        const active =
          item.href === "/owner"
            ? pathname === "/owner"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "ds-nav-item",
              active ? "ds-nav-item-active" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function OwnerSidebarBody({
  userEmail,
  onNavigate,
}: {
  userEmail?: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <Logo href="/owner" />
        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Owner Platform
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <OwnerNavLinks onNavigate={onNavigate} />
      </div>
      <div className="space-y-2 border-t border-border p-3">
        {userEmail ? (
          <p className="truncate px-2 text-xs text-muted-foreground">{userEmail}</p>
        ) : null}
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="ds-nav-item text-muted-foreground"
        >
          Business dashboard
        </Link>
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
    </div>
  );
}

export function OwnerShell({
  userEmail,
  children,
}: {
  userEmail?: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:block">
        <OwnerSidebarBody userEmail={userEmail} />
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium text-foreground lg:hidden">
              Owner Platform
            </p>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 px-4 py-5 md:px-6 md:py-7 lg:px-8">
          {children}
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(100%,16rem)] border-r border-border bg-card shadow-lg animate-fade-in-up">
            <div className="flex items-center justify-end p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <OwnerSidebarBody
              userEmail={userEmail}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
