"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

const TABS = [
  {
    id: "overview",
    label: "Overview",
    blurb: "KPIs, alerts, and quick actions owners see every morning.",
  },
  {
    id: "reception",
    label: "Reception",
    blurb: "Day view scheduling with real status and available slots.",
  },
  {
    id: "crm",
    label: "CRM",
    blurb: "Profiles, timeline, and communication in one customer record.",
  },
  {
    id: "reports",
    label: "Reports",
    blurb: "Executive metrics for revenue, appointments, and growth.",
  },
  {
    id: "emma",
    label: "Emma",
    blurb: "AI Receptionist grounded in your Chasum business data.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardShowcase() {
  const [tab, setTab] = useState<TabId>("overview");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <section
      id="showcase"
      className="border-y border-border bg-muted/30 px-6 py-20 md:py-28"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="showcase-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            Interactive product tour
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore the real Chasum dashboard structure before you sign up.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors",
                tab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-muted-foreground">
          {active.blurb}
        </p>

        <div className="mt-8">
          <DashboardPreview variant={tab} />
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/signup">
            <Button size="lg">Start Free to use the live product</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
