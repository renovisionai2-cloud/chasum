"use client";

import { Reveal } from "@/components/landing/reveal";
import { APPLY_HREF, PRIVATE_ALPHA_HREF } from "@/lib/marketing/alpha";
import {
  BadgeCheck,
  MessageSquareHeart,
  UsersRound,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const STATEMENTS: ReadonlyArray<{
  label: string;
  icon: LucideIcon;
}> = [
  { label: "Built with real operators", icon: UsersRound },
  { label: "Tested through real workflows", icon: Workflow },
  { label: "Improved through direct feedback", icon: MessageSquareHeart },
  { label: "Product status labelled honestly", icon: BadgeCheck },
];

const STATUSES = [
  "Available Today",
  "Early Access",
  "Coming Next",
  "Future Vision",
] as const;

/**
 * Real-world trust — no fake logos, portraits, or testimonials.
 */
export function TrustSection() {
  return (
    <section
      id="trust"
      className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="trust-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">
              Designed alongside real businesses
            </p>
            <h2 id="trust-heading" className="marketing-h2-xl">
              Growing through real partnerships.
            </h2>
            <p className="marketing-lede">
              Chasum is being shaped with service businesses that use
              scheduling, customer management, communication, payments and
              reporting every day.
            </p>
          </div>
        </Reveal>

        <ul className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
          {STATEMENTS.map((statement, index) => {
            const Icon = statement.icon;
            return (
              <Reveal key={statement.label} delayMs={index * 40}>
                <li className="flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card/50 px-5 py-4">
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-foreground">
                    {statement.label}
                  </span>
                </li>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delayMs={120}>
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Product status system
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {STATUSES.map((status) => (
                <li
                  key={status}
                  className="rounded-full border border-border/70 bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {status}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delayMs={160}>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={PRIVATE_ALPHA_HREF}
              className="marketing-focus-ring text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Why Private Alpha?
            </Link>
            <Link
              href={APPLY_HREF}
              className="marketing-focus-ring text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Apply for Private Alpha
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
