"use client";

import {
  getMobilePrimaryItems,
  isNavItemActive,
  type DashboardNavIcon,
} from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Calendar,
  LayoutDashboard,
  Menu,
  Sun,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const iconMap: Partial<Record<DashboardNavIcon, typeof LayoutDashboard>> = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  users: Users,
  banknote: Banknote,
  sun: Sun,
};

type MobileBottomNavProps = {
  onMore: () => void;
};

/** Focused mobile primary set + More (full sidebar). */
export function MobileBottomNav({ onMore }: MobileBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const items = getMobilePrimaryItems().filter(
    (i) => i.href !== "/dashboard/ai-workforce/summer",
  );
  // Keep five slots: Command Centre, Reception, Customers, Payments, More
  // Summer stays in header / full menu to avoid crowding.

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[var(--z-shell)] border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5 gap-0 px-1 pt-1">
        {items.slice(0, 4).map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const active = isNavItemActive(pathname, search, item);
          const label = item.mobileLabel ?? item.label;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[var(--touch-min)] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-1 text-[10px] font-medium ds-focus-ring",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="flex min-h-[var(--touch-min)] w-full flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-1 text-[10px] font-medium text-muted-foreground hover:text-foreground ds-focus-ring"
            aria-label="More navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
