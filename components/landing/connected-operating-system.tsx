"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { PLATFORM_HREF } from "@/lib/marketing/alpha";
import { CHASUM_SUPPORTING_LINE } from "@/lib/marketing/os-positioning";
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
    <Reveal delayMs={delayMs} className="h-full">
      <div className="flex h-full items-center rounded-2xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm backdrop-blur-sm transition-colors duration-250 hover:border-border hover:bg-card/90">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-foreground">
              {name}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {status}
            </p>
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
              Scheduling, customers, staff, payments, communications,
              reporting, automation, and AI are built to share one connected
              business context.
            </p>
            <p className="mt-3 text-base font-semibold tracking-tight text-foreground md:text-lg">
              {CHASUM_SUPPORTING_LINE}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-4 lg:mt-14 lg:grid-cols-[minmax(11.5rem,1fr)_minmax(0,1.35fr)_minmax(11.5rem,1fr)] lg:gap-6 xl:grid-cols-[minmax(12.5rem,1fr)_minmax(0,1.4fr)_minmax(12.5rem,1fr)] xl:gap-8">
          <ul className="flex h-auto flex-row gap-3 overflow-x-auto pb-1 lg:h-full lg:flex-col lg:justify-between lg:gap-3 lg:overflow-visible lg:pb-0">
            {LEFT.map((item, index) => (
              <li key={item.name} className="min-w-[11rem] flex-1 lg:min-w-0 lg:flex-none">
                <ModuleCard {...item} delayMs={index * 50} />
              </li>
            ))}
          </ul>

          <Reveal delayMs={80} className="h-full min-h-0">
            <div className="relative h-full">
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/18 via-transparent to-spark/12 blur-2xl"
                aria-hidden
              />
              <div className="fd-product-frame h-full overflow-hidden rounded-2xl border border-border/55 bg-card/90">
                <DashboardPreview
                  variant="overview"
                  navIa="current"
                  className="min-h-[280px] border-0 shadow-none md:min-h-[400px] lg:min-h-[440px]"
                />
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed tracking-wide text-muted-foreground">
                Illustrative demo data · not a live tenant
              </p>
            </div>
          </Reveal>

          <ul className="flex h-auto flex-row gap-3 overflow-x-auto pb-1 lg:h-full lg:flex-col lg:justify-between lg:gap-3 lg:overflow-visible lg:pb-0">
            {RIGHT.map((item, index) => (
              <li key={item.name} className="min-w-[11rem] flex-1 lg:min-w-0 lg:flex-none">
                <ModuleCard {...item} delayMs={index * 50 + 60} />
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          * Email when messaging is configured · SMS Early Access
        </p>

        <Reveal delayMs={120}>
          <div className="mt-8 flex justify-center">
            <Link
              href={PLATFORM_HREF}
              className="marketing-focus-ring inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Explore the Platform →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
