"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { PLATFORM_HREF } from "@/lib/marketing/alpha";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

const LEFT = [
  { name: "Scheduling", status: "Available Today", icon: CalendarDays },
  { name: "Customers", status: "Available Today", icon: Users },
  { name: "Communication", status: "Available Today*", icon: MessageSquare },
] as const;

const RIGHT = [
  { name: "Payments", status: "Available Today", icon: CreditCard },
  { name: "Reporting", status: "Available Today", icon: BarChart3 },
  { name: "AI Assistance", status: "Early Access", icon: Sparkles },
] as const;

function ModuleCard({
  name,
  status,
  icon: Icon,
  delayMs,
}: {
  name: string;
  status: string;
  icon: typeof CalendarDays;
  delayMs: number;
}) {
  return (
    <Reveal delayMs={delayMs}>
      <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/**
 * One connected operating system — homepage composition.
 */
export function ConnectedOperatingSystem() {
  return (
    <section
      id="platform"
      className="scroll-mt-24 overflow-hidden px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="connected-os-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">One operating system</p>
            <h2
              id="connected-os-heading"
              className="marketing-h2-xl"
            >
              Everything works together.
            </h2>
            <p className="marketing-lede">
              The work your team already does—connected through one operating
              system.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid items-center gap-5 lg:grid-cols-[200px_minmax(0,1.15fr)_200px] lg:gap-7 xl:grid-cols-[220px_minmax(0,1.2fr)_220px] xl:gap-8">
          <ul className="flex flex-row gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {LEFT.map((item, index) => (
              <li key={item.name} className="min-w-[11rem] flex-1 lg:min-w-0">
                <ModuleCard {...item} delayMs={index * 50} />
              </li>
            ))}
          </ul>

          <Reveal delayMs={80}>
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/18 via-transparent to-spark/12 blur-2xl"
                aria-hidden
              />
              <div className="fd-product-frame overflow-hidden rounded-2xl border border-border/55 bg-card/90">
                <DashboardPreview
                  variant="overview"
                  className="min-h-[280px] border-0 shadow-none md:min-h-[400px] lg:min-h-[440px]"
                />
              </div>
            </div>
          </Reveal>

          <ul className="flex flex-row gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {RIGHT.map((item, index) => (
              <li key={item.name} className="min-w-[11rem] flex-1 lg:min-w-0">
                <ModuleCard {...item} delayMs={index * 50 + 60} />
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          * Email when messaging is configured · SMS Early Access
        </p>

        <Reveal delayMs={120}>
          <div className="mt-10 text-center">
            <Link
              href={PLATFORM_HREF}
              className="marketing-focus-ring text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Explore the Platform →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
