"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  MessageSquareText,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PreviewVariant =
  | "overview"
  | "reception"
  | "crm"
  | "reports"
  | "emma"
  | "employees"
  | "business"
  | "communication"
  | "billing";

const MODULE_ICONS: Record<string, LucideIcon> = {
  emma: Sparkles,
  crm: Users,
  calendar: CalendarDays,
  employees: UserCog,
  business: Building2,
  reports: BarChart3,
  communication: MessageSquareText,
  billing: CreditCard,
  workforce: Sparkles,
};

function previewFor(
  preview: (typeof PLATFORM_MODULES)[number]["preview"],
): PreviewVariant {
  switch (preview) {
    case "calendar":
      return "reception";
    case "crm":
      return "crm";
    case "communication":
      return "communication";
    case "reports":
      return "reports";
    case "billing":
      return "billing";
    case "employees":
      return "employees";
    case "business":
      return "business";
    case "emma":
    case "workforce":
      return "emma";
    default:
      return "overview";
  }
}

/** Featured cinematic experiences — product first, not feature cards */
const FEATURED_IDS = ["emma", "calendar", "crm", "reports"] as const;

export function PlatformOverview() {
  const featured = PLATFORM_MODULES.filter((mod) =>
    FEATURED_IDS.includes(mod.id as (typeof FEATURED_IDS)[number]),
  );
  const [activeId, setActiveId] = useState(featured[0]?.id ?? "emma");
  const active = featured.find((mod) => mod.id === activeId) ?? featured[0];
  const rest = PLATFORM_MODULES.filter(
    (mod) => !FEATURED_IDS.includes(mod.id as (typeof FEATURED_IDS)[number]),
  );

  if (!active) return null;

  const Icon = MODULE_ICONS[active.id] ?? Sparkles;

  return (
    <section
      id="platform"
      className="scroll-mt-24 overflow-hidden px-6 py-24 md:py-36"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="marketing-eyebrow">One Operating System</p>
            <h2 id="platform-heading" className="marketing-h2-xl">
              Real departments. One experience.
            </h2>
            <p className="marketing-lede">
              Chasum ships the same modules you run in the dashboard — watch
              them work, not just describe them.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mt-14 flex flex-wrap justify-center gap-2">
            {featured.map((mod) => {
              const ModIcon = MODULE_ICONS[mod.id] ?? Sparkles;
              const selected = mod.id === activeId;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveId(mod.id)}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  <ModIcon className="h-4 w-4" strokeWidth={1.75} />
                  {mod.name}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div
            key={active.id}
            id={`platform-${active.id}`}
            className="marketing-tour-transition mt-10 grid scroll-mt-24 items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14"
          >
            <div>
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {active.name}
                </h3>
                {active.comingSoon ? (
                  <span className="rounded-full bg-spark-muted px-2.5 py-0.5 text-xs font-medium text-spark">
                    Coming Soon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    <span className="marketing-live-dot h-1.5 w-1.5 rounded-full bg-success" />
                    Live
                  </span>
                )}
              </div>
              <p className="mt-4 text-lg font-medium text-foreground">
                {active.benefit}
              </p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                {active.explanation}
              </p>
              <Link href={active.ctaHref} className="mt-8 inline-block">
                <Button size="lg" className="marketing-cta-button min-h-12 rounded-full px-7">
                  {active.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="marketing-product-frame">
              <DashboardPreview
                variant={previewFor(active.preview)}
                live
                animated
                className="min-h-[380px] border-0 shadow-none md:min-h-[520px]"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-16 border-t border-border/60 pt-10">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Also in the operating system
            </p>
            <ul className="flex flex-wrap justify-center gap-2.5">
              {rest.map((mod) => {
                const ModIcon = MODULE_ICONS[mod.id] ?? Sparkles;
                return (
                  <li key={mod.id}>
                    <Link
                      href={mod.href}
                      id={`platform-${mod.id}`}
                      className="inline-flex min-h-11 scroll-mt-24 items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      <ModIcon className="h-3.5 w-3.5" />
                      {mod.name}
                      {mod.comingSoon ? (
                        <span className="text-[10px] uppercase tracking-wide text-spark">
                          Soon
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
