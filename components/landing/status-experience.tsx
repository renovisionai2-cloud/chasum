"use client";

import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { CONTACT_HREF } from "@/lib/marketing/alpha";
import {
  STATUS_ISSUES,
  STATUS_LAST_UPDATED,
  STATUS_LEGEND,
  STATUS_MAINTENANCE,
  STATUS_PAGE,
  STATUS_SERVICES,
  STATUS_SUPPORT,
  type StatusLevel,
} from "@/lib/marketing/resources-status";
import { cn } from "@/lib/utils";
import Link from "next/link";

function statusBadgeClass(status: StatusLevel) {
  switch (status) {
    case "Operational":
      return "bg-success/15 text-success";
    case "Configuration Required":
      return "bg-spark-muted text-spark";
    case "Maintenance":
      return "bg-muted text-muted-foreground";
    case "Limited":
      return "bg-primary/10 text-primary";
    case "Unavailable":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function StatusBadge({ status }: { status: StatusLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        statusBadgeClass(status),
      )}
    >
      {status}
    </span>
  );
}

export function StatusExperience() {
  return (
    <div className="relative overflow-hidden bg-background">
      <section
        className="relative scroll-mt-24 px-6 pb-14 pt-28 md:pb-20 md:pt-36"
        aria-labelledby="status-heading"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_72%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="marketing-eyebrow">{STATUS_PAGE.eyebrow}</p>
            <h1
              id="status-heading"
              className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl"
            >
              {STATUS_PAGE.headline}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {STATUS_PAGE.lede}
            </p>
          </Reveal>
          <Reveal delayMs={60}>
            <p className="mt-8 text-sm text-muted-foreground">
              Last updated:{" "}
              <time dateTime={STATUS_LAST_UPDATED} className="font-medium text-foreground">
                {STATUS_LAST_UPDATED}
              </time>
            </p>
          </Reveal>
        </div>
      </section>

      <section
        className="scroll-mt-24 px-6 pb-16 md:pb-24"
        aria-labelledby="status-services-heading"
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2
              id="status-services-heading"
              className="text-xl font-semibold tracking-tight text-foreground md:text-2xl"
            >
              Current Services
            </h2>
          </Reveal>

          <ul className="mt-8 space-y-3">
            {STATUS_SERVICES.map((service, index) => (
              <Reveal
                key={service.name}
                delayMs={Math.min(index * 35, 180)}
              >
                <li className="marketing-card-lift rounded-[1.25rem] border border-border/60 bg-card/80 px-5 py-4 md:px-6 md:py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {service.name}
                      </p>
                      {service.note ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {service.note}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="scroll-mt-24 bg-muted/25 px-6 py-16 md:py-20"
        aria-labelledby="status-legend-heading"
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2
              id="status-legend-heading"
              className="text-xl font-semibold tracking-tight text-foreground md:text-2xl"
            >
              Status Legend
            </h2>
          </Reveal>
          <ul className="mt-8 space-y-3">
            {STATUS_LEGEND.map((item, index) => (
              <Reveal key={item.status} delayMs={Math.min(index * 30, 150)}>
                <li className="flex flex-col gap-2 rounded-[1.15rem] border border-border/50 bg-card/70 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
                  <StatusBadge status={item.status} />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.meaning}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="scroll-mt-24 px-6 py-16 md:py-20">
        <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
          <Reveal>
            <article className="h-full rounded-[1.35rem] border border-border/60 bg-card/80 p-6 md:p-7">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {STATUS_MAINTENANCE.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                {STATUS_MAINTENANCE.body}
              </p>
            </article>
          </Reveal>
          <Reveal delayMs={40}>
            <article className="h-full rounded-[1.35rem] border border-border/60 bg-card/80 p-6 md:p-7">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {STATUS_ISSUES.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                {STATUS_ISSUES.body}
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      <section
        className="scroll-mt-24 px-6 pb-24 pt-4 md:pb-32"
        aria-labelledby="status-support-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2
              id="status-support-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {STATUS_SUPPORT.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {STATUS_SUPPORT.body}
            </p>
          </Reveal>
          <Reveal delayMs={60}>
            <div className="mt-8">
              <Link href={`${CONTACT_HREF}#support`}>
                <Button
                  size="lg"
                  className="marketing-cta-button h-12 rounded-full px-8"
                >
                  Contact Support
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
