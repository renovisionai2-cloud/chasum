"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
import { APPLY_HREF, CTA_EARLY_ACCESS_LABEL, MEET_SUMMER_HREF } from "@/lib/marketing/alpha";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const SHOWCASE_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    name: "Business Dashboard",
    preview: "overview" as const,
    icon: LayoutDashboard,
    benefit: "See what needs attention before the day gets busy.",
    explanation:
      "Appointments, revenue, customers, and operational signals come together in one calm command center.",
    benefits: ["Live operating snapshot", "Today and weekly activity", "Fast access to every department"],
    cta: "Explore Chasum",
    ctaHref: APPLY_HREF,
  },
  {
    id: "summer",
    label: "Summer",
    name: "Summer — AI Business Assistant",
    preview: "summer" as const,
    icon: Sparkles,
    benefit: "Grounded answers from real business data — never invented availability.",
    explanation:
      "Summer is Chasum's AI Business Assistant: website concierge, receptionist assist, and product guide for design partners in Early Access.",
    benefits: ["Grounded business answers", "Real availability only", "Human escalation"],
    cta: "Meet Summer",
    ctaHref: MEET_SUMMER_HREF,
  },
  {
    id: "crm",
    label: "CRM",
    preview: "crm" as const,
    icon: Users,
    benefits: ["Complete customer timeline", "Notes and documents", "Booking and payment context"],
  },
  {
    id: "calendar",
    label: "Calendar",
    preview: "reception" as const,
    icon: CalendarDays,
    benefits: ["Staff-aware availability", "Day, week, and resource views", "Waitlist and booking controls"],
  },
  {
    id: "employees",
    label: "Employees",
    preview: "employees" as const,
    icon: BriefcaseBusiness,
    benefits: ["Roles and departments", "Location assignments", "Performance context"],
  },
  {
    id: "business",
    label: "Business",
    preview: "business" as const,
    icon: Building2,
    benefits: ["Locations and resources", "Services and commerce", "Rules and forms"],
  },
  {
    id: "reports",
    label: "Reports",
    preview: "reports" as const,
    icon: BarChart3,
    benefits: ["Executive KPIs", "Revenue breakdowns", "Exports and schedules"],
  },
  {
    id: "communication",
    label: "Communication",
    preview: "communication" as const,
    icon: MessageSquareText,
    benefits: ["Unified conversation view", "Email and SMS actions", "Follow-up reminders"],
  },
  {
    id: "billing",
    label: "Billing",
    preview: "billing" as const,
    icon: CreditCard,
    benefits: ["Plan and trial visibility", "Invoice history", "Payment-ready architecture"],
  },
] as const;

type TabId = (typeof SHOWCASE_TABS)[number]["id"];
const STORAGE_KEY = "chasum-marketing-tour-department";
const STORAGE_EVENT = "chasum-tour-change";

function isTabId(value: string | null): value is TabId {
  return SHOWCASE_TABS.some((tab) => tab.id === value);
}

function subscribeToTour(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

function getTourSnapshot(): TabId {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isTabId(saved) ? saved : "dashboard";
}

function selectTourTab(tab: TabId) {
  window.localStorage.setItem(STORAGE_KEY, tab);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/**
 * V3 Product Tour — visitors should feel like they are already using Chasum.
 * Product dominates; copy is secondary.
 */
export function DashboardShowcase() {
  const selectedTab = useSyncExternalStore(
    subscribeToTour,
    getTourSnapshot,
    () => "dashboard",
  );
  const active =
    SHOWCASE_TABS.find((item) => item.id === selectedTab) ?? SHOWCASE_TABS[0];
  const moduleCopy =
    active.id === "dashboard"
      ? active
      : PLATFORM_MODULES.find((module) => module.id === active.id);
  const Icon = active.icon;

  return (
    <section
      id="showcase"
      className="marketing-section-contain marketing-surface-tint marketing-hairline-y scroll-mt-24 overflow-hidden px-4 py-24 sm:px-6 md:py-36"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-[1480px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">Product</p>
            <h2 id="showcase-heading" className="marketing-h2-xl">
              Feel the Product Before You Sign Up
            </h2>
            <p className="marketing-lede">
              Choose a department. Watch the live surface update. Less reading —
              more operating.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mt-14 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
            <div
              className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Departments"
            >
              {SHOWCASE_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tour-tab-${item.id}`}
                  aria-controls="tour-panel"
                  aria-selected={selectedTab === item.id}
                  onClick={() => selectTourTab(item.id)}
                  className={cn(
                    "group flex min-h-12 shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedTab === item.id
                      ? "border-primary/30 bg-card text-foreground shadow-md shadow-foreground/[0.04]"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-card/70 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      selectedTab === item.id ? "text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </button>
              ))}
            </div>

            <div
              id="tour-panel"
              role="tabpanel"
              aria-labelledby={`tour-tab-${active.id}`}
              className="min-w-0"
            >
              <div key={active.id} className="marketing-tour-transition">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xl">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-primary">
                        {moduleCopy?.name ?? active.label}
                      </p>
                    </div>
                    <p className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {moduleCopy?.benefit}
                    </p>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {active.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="marketing-product-frame">
                  <DashboardPreview
                    variant={active.preview}
                    live
                    className="min-h-[400px] border-0 shadow-none md:min-h-[560px] xl:min-h-[620px]"
                  />
                </div>

                <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs text-muted-foreground">
                    Your selected department is remembered for your next visit.
                  </p>
                  <Link href={moduleCopy?.ctaHref ?? APPLY_HREF}>
                    <Button className="marketing-cta-button rounded-full px-6">
                      {moduleCopy?.cta ?? CTA_EARLY_ACCESS_LABEL}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
