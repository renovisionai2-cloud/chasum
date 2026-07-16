"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
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
    ctaHref: "/signup",
  },
  {
    id: "emma",
    label: "AI Receptionist",
    preview: "emma" as const,
    icon: Sparkles,
    benefits: ["Grounded business answers", "Real availability only", "Human escalation"],
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
      className="scroll-mt-20 overflow-hidden border-y border-border bg-muted/30 px-6 py-24 md:py-36"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Product tour
            </p>
            <h2
              id="showcase-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Tour the complete Chasum platform
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose a department to see its real product surface, purpose, and
              operational benefits.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div
            className="mt-10 -mx-1 flex gap-2 overflow-x-auto px-1 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:justify-center"
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
                  "group flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",
                  selectedTab === item.id
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border/70 bg-card/80 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:text-foreground hover:shadow-sm",
                )}
              >
                <item.icon
                  className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.75}
                />
                {item.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div
            id="tour-panel"
            role="tabpanel"
            aria-labelledby={`tour-tab-${active.id}`}
            className="mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-card/70 p-4 shadow-xl shadow-foreground/[0.04] backdrop-blur-sm md:p-6"
          >
            <div key={active.id} className="marketing-tour-transition">
              <div className="mb-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
                <div>
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-2xl font-semibold tracking-tight">
                    {moduleCopy?.name ?? active.label}
                  </p>
                  <p className="mt-2 text-base font-medium text-foreground">
                    {moduleCopy?.benefit}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {moduleCopy?.explanation}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {active.benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border/60 bg-background/70 px-3 py-2.5 text-xs text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              <DashboardPreview
                variant={active.preview}
                live
                className="marketing-preview-glow min-h-[360px] w-full max-w-full shadow-2xl md:min-h-[520px]"
              />

              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-5 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Your selected department is remembered for your next visit.
                </p>
                <Link href={moduleCopy?.ctaHref ?? "/signup"}>
                  <Button className="marketing-cta-button">
                    {moduleCopy?.cta ?? "Start Free"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
