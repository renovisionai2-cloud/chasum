"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
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
  CalendarDays,
  Check,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  Sun,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

/** Current-generation operating areas — Platform and Product Tour. */
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

type AreaTabId = (typeof PLATFORM_SHOWCASE_TABS)[number]["id"];
const TOUR_STORAGE_KEY = "chasum-marketing-tour-department";
const PLATFORM_STORAGE_KEY = "chasum-marketing-platform-area";
const STORAGE_EVENT = "chasum-tour-change";

const TOUR_TAB_ALIASES: Record<string, AreaTabId> = {
  dashboard: "command-centre",
  calendar: "reception",
  crm: "customers",
  billing: "payments",
  communication: "communications",
  business: "command-centre",
};

function field(obj: object | undefined, key: string): string | undefined {
  if (!obj || !(key in obj)) return undefined;
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function isAreaTabId(value: string | null): value is AreaTabId {
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

function getTourSnapshot(): AreaTabId {
  const saved = window.localStorage.getItem(TOUR_STORAGE_KEY);
  if (isAreaTabId(saved)) return saved;
  const mapped = saved ? TOUR_TAB_ALIASES[saved] : undefined;
  return mapped ?? "command-centre";
}

function getPlatformSnapshot(): AreaTabId {
  const saved = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
  return isAreaTabId(saved) ? saved : "command-centre";
}

function selectTourTab(tab: AreaTabId) {
  window.localStorage.setItem(TOUR_STORAGE_KEY, tab);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function selectPlatformTab(tab: AreaTabId) {
  window.localStorage.setItem(PLATFORM_STORAGE_KEY, tab);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/**
 * Product surfaces showcase — shared by Platform and Product Tour.
 * Platform mode is locked; Product Tour uses the same current-generation IA.
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
    () => "command-centre" as const,
  );
  const platformTab = useSyncExternalStore(
    subscribeToTour,
    getPlatformSnapshot,
    () => "command-centre" as const,
  );
  const tabs = PLATFORM_SHOWCASE_TABS;
  const selectedTab = isPlatform ? platformTab : tourTab;
  const active =
    tabs.find((item) => item.id === selectedTab) ?? tabs[0];
  const moduleCopy = active;
  const Icon = active.icon;
  const ctaHref = field(active, "ctaHref") ?? field(moduleCopy, "ctaHref") ?? APPLY_HREF;
  const ctaLabel = field(active, "cta") ?? field(moduleCopy, "cta") ?? CTA_APPLY_LABEL;
  const signal = isPlatform ? PLATFORM_AREA_SIGNALS[active.id] : undefined;
  const tourStop = isTour ? PRODUCT_TOUR_STOPS[active.id] : undefined;

  return (
    <section
      id="showcase"
      className={cn(
        "marketing-section-contain marketing-surface-tint marketing-hairline-y scroll-mt-24 overflow-hidden px-4 sm:px-6",
        isPlatform ? "pt-14 pb-20 md:pt-20 md:pb-28" : "pt-8 pb-14 md:pt-10 md:pb-16",
      )}
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
            <p
              className={
                isPlatform
                  ? "marketing-lede"
                  : "mx-auto mt-3 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
              }
            >
              {isPlatform
                ? PLATFORM_SHOWCASE.lede
                : PRODUCT_TOUR_SHOWCASE.lede}
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div
            className={cn(
              "grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]",
              isPlatform ? "mt-10 md:mt-12" : "mt-8 md:mt-9",
            )}
          >
            <div className="min-w-0">
            <div
              className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label={isPlatform ? "Business areas" : "Operating areas"}
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
                    if (isPlatform && isAreaTabId(item.id)) {
                      selectPlatformTab(item.id);
                    } else if (isAreaTabId(item.id)) {
                      selectTourTab(item.id);
                    }
                  }}
                  className={cn(
                    "group flex min-h-12 shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedTab === item.id
                      ? isPlatform
                        ? "border-primary/40 bg-background text-foreground"
                        : "border-primary/30 bg-card text-foreground shadow-md shadow-foreground/[0.04]"
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
            {isTour ? (
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                Your last selected area is remembered.
              </p>
            ) : null}
            </div>

            <div
              id="tour-panel"
              role="tabpanel"
              aria-labelledby={`tour-tab-${active.id}`}
              className="min-w-0"
            >
              <div key={active.id} className="marketing-tour-transition">
                <div
                  className={cn(
                    "mb-4 flex flex-col gap-3",
                    isPlatform &&
                      "mb-5 gap-4 sm:flex-row sm:items-end sm:justify-between",
                  )}
                >
                  <div className={isTour ? "max-w-2xl" : "max-w-xl"}>
                    {isTour ? (
                      <>
                        <div className="mb-1.5 flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            {active.label}
                          </h3>
                        </div>
                        {tourStop ? (
                          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                            {tourStop.why}
                          </p>
                        ) : null}
                        {tourStop ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            <span className="font-medium text-primary/90">
                              {tourStop.moment.kind}.
                            </span>{" "}
                            {tourStop.moment.text}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <div className="mb-2 flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium text-primary">
                            {field(moduleCopy, "name") ?? active.label}
                          </p>
                        </div>
                        <p className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                          {field(moduleCopy, "benefit")}
                        </p>
                        {signal ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {signal}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                  <ul
                    className={cn(
                      "flex flex-wrap gap-2",
                      isTour && "max-w-xl",
                    )}
                  >
                    {active.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                          isPlatform
                            ? "border-border/70 bg-background text-foreground/70"
                            : "border-border/50 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground",
                        )}
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
                    navIa="current"
                    chromeLabel={`Chasum · ${active.label}`}
                    className="min-h-[400px] border-0 shadow-none md:min-h-[560px] xl:min-h-[620px]"
                  />
                </div>

                <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs text-muted-foreground">
                    Illustrative demo data · not a live tenant
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
            <p className="mx-auto mt-12 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:mt-14 md:text-lg">
              {PLATFORM_SHOWCASE.bridgeToConclusion}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
