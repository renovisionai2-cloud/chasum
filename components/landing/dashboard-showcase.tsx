"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
} from "@/lib/marketing/alpha";
import {
  PLATFORM_AREA_SIGNALS,
  PLATFORM_SHOWCASE,
} from "@/lib/marketing/platform-page";
import {
  PRODUCT_TOUR_SHOWCASE,
  PRODUCT_TOUR_STOPS,
} from "@/lib/marketing/product-tour-page";
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
  Sun,
  UserCog,
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
    benefits: [
      "Operating snapshot",
      "Today and weekly activity",
      "Fast access to every department",
    ],
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
  },
  {
    id: "summer",
    label: "Summer",
    name: "Summer — AI Business Manager",
    preview: "summer" as const,
    icon: Sparkles,
    benefit:
      "Grounded answers from real business data — never invented availability.",
    explanation:
      "Summer is Chasum's AI Business Manager: discovery, onboarding, daily operations, staff guidance, and growth. AI Receptionist work—calls, booking, and inquiries—is one capability within that role.",
    benefits: [
      "Grounded business answers",
      "Real availability only",
      "Human escalation",
    ],
    cta: CTA_MEET_SUMMER_LABEL,
    ctaHref: MEET_SUMMER_HREF,
  },
  {
    id: "crm",
    label: "CRM",
    preview: "crm" as const,
    icon: Users,
    benefits: [
      "Complete customer timeline",
      "Notes and documents",
      "Booking and payment context",
    ],
  },
  {
    id: "calendar",
    label: "Calendar",
    preview: "reception" as const,
    icon: CalendarDays,
    benefits: [
      "Staff-aware availability",
      "Day, week, and resource views",
      "Waitlist and booking controls",
    ],
  },
  {
    id: "employees",
    label: "Employees",
    preview: "employees" as const,
    icon: BriefcaseBusiness,
    benefits: [
      "Roles and departments",
      "Location assignments",
      "Performance context",
    ],
  },
  {
    id: "business",
    label: "Business",
    preview: "business" as const,
    icon: Building2,
    benefits: [
      "Locations and resources",
      "Services and commerce",
      "Rules and forms",
    ],
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
    benefits: [
      "Unified conversation view",
      "Email and SMS actions",
      "Follow-up reminders",
    ],
  },
  {
    id: "billing",
    label: "Billing",
    preview: "billing" as const,
    icon: CreditCard,
    benefits: [
      "Plan and trial visibility",
      "Invoice history",
      "Payment-ready architecture",
    ],
  },
] as const;

/** Current-generation Platform selector — Product Tour keeps SHOWCASE_TABS. */
const PLATFORM_SHOWCASE_TABS = [
  {
    id: "command-centre",
    label: "Command Centre",
    name: "Command Centre",
    preview: "overview" as const,
    icon: LayoutDashboard,
    benefit: "See what needs attention before the day gets busy.",
    explanation:
      "Appointments, revenue, customers, and operational signals come together in one calm command centre.",
    benefits: [
      "Operating snapshot",
      "Today and weekly activity",
      "Fast access across the business",
    ],
    cta: CTA_APPLY_LABEL,
    ctaHref: APPLY_HREF,
  },
  {
    id: "reception",
    label: "Reception",
    name: "Reception",
    preview: "reception" as const,
    icon: CalendarDays,
    benefit: "Fill the day with real openings — never invented times.",
    explanation:
      "Staff-aware availability, day and resource views, and booking controls on the same schedule memory.",
    benefits: [
      "Staff-aware availability",
      "Day, week, and resource views",
      "Waitlist and booking controls",
    ],
  },
  {
    id: "customers",
    label: "Customers",
    name: "Customers",
    preview: "crm" as const,
    icon: Users,
    benefit: "Know every customer history, note, and conversation in one profile.",
    explanation:
      "Directory, profiles, timeline, and payment events — connected to appointments and communications.",
    benefits: [
      "Complete customer timeline",
      "Notes and documents",
      "Booking and payment context",
    ],
  },
  {
    id: "employees",
    label: "Employees",
    name: "Employees",
    preview: "employees" as const,
    icon: UserCog,
    benefit: "Run the team with schedules, roles, and performance in one place.",
    explanation:
      "Directory, profiles, location assignments, and activity on the same operating day.",
    benefits: [
      "Roles and locations",
      "Location assignments",
      "Performance context",
    ],
  },
  {
    id: "payments",
    label: "Payments",
    name: "Payments",
    preview: "billing" as const,
    icon: CreditCard,
    benefit: "Record deposits, payments and balances beside the work that created them.",
    explanation:
      "Commerce events stay on the same customer and service record. Illustrative demo data only.",
    benefits: [
      "Recorded payments",
      "Deposits and balances",
      "Customer and visit context",
    ],
  },
  {
    id: "reports",
    label: "Reports",
    name: "Reports",
    preview: "reports" as const,
    icon: BarChart3,
    benefit: "Understand performance in minutes, not spreadsheets.",
    explanation:
      "Executive KPIs and activity views from connected operational data—not a disconnected export ritual.",
    benefits: ["Executive KPIs", "Revenue breakdowns", "Exports and schedules"],
  },
  {
    id: "communications",
    label: "Communications",
    name: "Communications",
    preview: "communication" as const,
    icon: MessageSquareText,
    benefit: "Call, text, email, and follow up without leaving the customer record.",
    explanation:
      "Unified timeline, notes, reminders, and configured messaging providers when they are connected.",
    benefits: [
      "Unified conversation view",
      "Email and SMS actions",
      "Follow-up reminders",
    ],
  },
  {
    id: "summer",
    label: "Summer",
    name: "Summer — AI Business Manager",
    preview: "summer" as const,
    icon: Sun,
    benefit:
      "Grounded answers from real business data — never invented availability.",
    explanation:
      "Summer is Chasum's AI Business Manager: discovery, onboarding, daily operations, staff guidance, and growth. AI Receptionist work—calls, booking, and inquiries—is one capability within that role.",
    benefits: [
      "Grounded business answers",
      "Real availability only",
      "Human escalation",
    ],
    cta: CTA_MEET_SUMMER_LABEL,
    ctaHref: MEET_SUMMER_HREF,
  },
] as const;

type TourTabId = (typeof SHOWCASE_TABS)[number]["id"];
type PlatformTabId = (typeof PLATFORM_SHOWCASE_TABS)[number]["id"];
const TOUR_STORAGE_KEY = "chasum-marketing-tour-department";
const PLATFORM_STORAGE_KEY = "chasum-marketing-platform-area";
const STORAGE_EVENT = "chasum-tour-change";

function field(obj: object | undefined, key: string): string | undefined {
  if (!obj || !(key in obj)) return undefined;
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function isTourTabId(value: string | null): value is TourTabId {
  return SHOWCASE_TABS.some((tab) => tab.id === value);
}

function isPlatformTabId(value: string | null): value is PlatformTabId {
  return PLATFORM_SHOWCASE_TABS.some((tab) => tab.id === value);
}

function subscribeToTour(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

function getTourSnapshot(): TourTabId {
  const saved = window.localStorage.getItem(TOUR_STORAGE_KEY);
  return isTourTabId(saved) ? saved : "dashboard";
}

function getPlatformSnapshot(): PlatformTabId {
  const saved = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
  return isPlatformTabId(saved) ? saved : "command-centre";
}

function selectTourTab(tab: TourTabId) {
  window.localStorage.setItem(TOUR_STORAGE_KEY, tab);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function selectPlatformTab(tab: PlatformTabId) {
  window.localStorage.setItem(PLATFORM_STORAGE_KEY, tab);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/**
 * Product surfaces showcase — shared by Platform and Product Tour.
 * Platform mode strengthens the one-operating-system story without layout changes.
 */
export function DashboardShowcase({
  mode = "tour",
}: {
  mode?: "platform" | "tour";
}) {
  const isPlatform = mode === "platform";
  const isTour = mode === "tour";
  const tourTab = useSyncExternalStore(
    subscribeToTour,
    getTourSnapshot,
    () => "dashboard" as const,
  );
  const platformTab = useSyncExternalStore(
    subscribeToTour,
    getPlatformSnapshot,
    () => "command-centre" as const,
  );
  const tabs = isPlatform ? PLATFORM_SHOWCASE_TABS : SHOWCASE_TABS;
  const selectedTab = isPlatform ? platformTab : tourTab;
  const active =
    tabs.find((item) => item.id === selectedTab) ?? tabs[0];
  const moduleCopy =
    isPlatform || active.id === "dashboard"
      ? active
      : PLATFORM_MODULES.find((module) => module.id === active.id);
  const Icon = active.icon;
  const ctaHref = field(active, "ctaHref") ?? field(moduleCopy, "ctaHref") ?? APPLY_HREF;
  const ctaLabel = field(active, "cta") ?? field(moduleCopy, "cta") ?? CTA_APPLY_LABEL;
  const signal = isPlatform ? PLATFORM_AREA_SIGNALS[active.id] : undefined;
  const tourStop = isTour ? PRODUCT_TOUR_STOPS[active.id] : undefined;

  return (
    <section
      id="showcase"
      className="marketing-section-contain marketing-surface-tint marketing-hairline-y scroll-mt-24 overflow-hidden px-4 py-24 sm:px-6 md:py-36"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-[1480px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">
              {isPlatform
                ? PLATFORM_SHOWCASE.eyebrow
                : PRODUCT_TOUR_SHOWCASE.eyebrow}
            </p>
            <h2 id="showcase-heading" className="marketing-h2-xl">
              {isPlatform
                ? PLATFORM_SHOWCASE.headline
                : PRODUCT_TOUR_SHOWCASE.headline}
            </h2>
            <p className="marketing-lede">
              {isPlatform
                ? PLATFORM_SHOWCASE.lede
                : PRODUCT_TOUR_SHOWCASE.lede}
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mt-14 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
            <div
              className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label={isPlatform ? "Business areas" : "Departments"}
            >
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tour-tab-${item.id}`}
                  aria-controls="tour-panel"
                  aria-selected={selectedTab === item.id}
                  onClick={() => {
                    if (isPlatform && isPlatformTabId(item.id)) {
                      selectPlatformTab(item.id);
                    } else if (isTourTabId(item.id)) {
                      selectTourTab(item.id);
                    }
                  }}
                  className={cn(
                    "group flex min-h-12 shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedTab === item.id
                      ? "border-primary/30 bg-card text-foreground shadow-md shadow-foreground/[0.04]"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-card/70 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      selectedTab === item.id
                        ? "text-primary"
                        : "text-muted-foreground",
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
                        {field(moduleCopy, "name") ?? active.label}
                      </p>
                    </div>
                    {isTour && tourStop ? (
                      <p className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        {tourStop.why}
                      </p>
                    ) : (
                      <p className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        {field(moduleCopy, "benefit")}
                      </p>
                    )}
                    {isTour && field(moduleCopy, "benefit") ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {field(moduleCopy, "benefit")}
                      </p>
                    ) : null}
                    {isTour && tourStop ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        <span className="font-medium text-primary/90">
                          {tourStop.moment.kind}.
                        </span>{" "}
                        {tourStop.moment.text}
                      </p>
                    ) : null}
                    {isPlatform && signal ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {signal}
                      </p>
                    ) : null}
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
                    live={false}
                    navIa={isPlatform ? "current" : "legacy"}
                    chromeLabel={
                      isPlatform ? "Chasum · Business Dashboard" : undefined
                    }
                    className="min-h-[400px] border-0 shadow-none md:min-h-[560px] xl:min-h-[620px]"
                  />
                </div>

                <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs text-muted-foreground">
                    {isPlatform
                      ? "Illustrative demo data · not a live tenant"
                      : "Your selected department is remembered for your next visit."}
                  </p>
                  <Link href={ctaHref}>
                    <Button className="marketing-cta-button rounded-full px-6">
                      {ctaLabel}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {isPlatform ? (
          <Reveal delayMs={120}>
            <p className="mx-auto mt-16 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
              {PLATFORM_SHOWCASE.bridgeToConclusion}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
