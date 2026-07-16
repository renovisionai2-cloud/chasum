"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

const SHOWCASE_TABS = [
  { id: "emma", label: "AI Receptionist", preview: "emma" as const },
  { id: "crm", label: "CRM", preview: "crm" as const },
  { id: "calendar", label: "Calendar", preview: "reception" as const },
  { id: "employees", label: "Employees", preview: "employees" as const },
  { id: "business", label: "Business", preview: "business" as const },
  { id: "reports", label: "Reports", preview: "reports" as const },
  { id: "communication", label: "Communication", preview: "communication" as const },
  { id: "billing", label: "Billing", preview: "billing" as const },
] as const;

type TabId = (typeof SHOWCASE_TABS)[number]["id"];

export function DashboardShowcase() {
  const [tab, setTab] = useState<TabId>("emma");
  const active = SHOWCASE_TABS.find((t) => t.id === tab) ?? SHOWCASE_TABS[0];
  const moduleCopy = useMemo(
    () => PLATFORM_MODULES.find((m) => m.id === (tab === "calendar" ? "calendar" : tab)),
    [tab],
  );

  return (
    <section
      id="showcase"
      className="scroll-mt-20 border-y border-border bg-muted/30 px-6 py-20 md:py-28"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="showcase-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Interactive platform showcase
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Click a department to update the dashboard preview — the same
              structure you get after you sign up.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div
            className="mt-10 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Departments"
          >
            {SHOWCASE_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium transition-all duration-200",
                  tab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "bg-card text-muted-foreground hover:-translate-y-0.5 hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[var(--radius-md)] border border-border/70 bg-card p-5">
              <p className="text-lg font-semibold tracking-tight">
                {moduleCopy?.name ?? active.label}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {moduleCopy?.benefit}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {moduleCopy?.explanation}
              </p>
              <Link href={moduleCopy?.ctaHref ?? "/signup"} className="mt-6 inline-block">
                <Button>{moduleCopy?.cta ?? "Start Free"}</Button>
              </Link>
            </div>
            <DashboardPreview variant={active.preview} animated />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
