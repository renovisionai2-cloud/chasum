"use client";

import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import {
  CONTACT_HREF,
  STATUS_HREF,
} from "@/lib/marketing/alpha";
import {
  SECURITY_CARDS,
  SECURITY_PAGE,
  SECURITY_SUPPORT,
  SECURITY_TRANSPARENCY,
} from "@/lib/marketing/resources-security";
import {
  ArrowRight,
  Cloud,
  Lock,
  RefreshCw,
  ShieldCheck,
  Building2,
  HardDrive,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const ICONS: Record<(typeof SECURITY_CARDS)[number]["icon"], LucideIcon> = {
  auth: Lock,
  workspace: Building2,
  encrypt: ShieldCheck,
  cloud: Cloud,
  backup: HardDrive,
  improve: RefreshCw,
};

export function SecurityExperience() {
  return (
    <div className="relative overflow-hidden bg-background">
      <section
        className="relative scroll-mt-24 px-6 pb-16 pt-28 md:pb-24 md:pt-36"
        aria-labelledby="security-heading"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_72%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="marketing-eyebrow">{SECURITY_PAGE.eyebrow}</p>
            <h1
              id="security-heading"
              className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl"
            >
              {SECURITY_PAGE.headline}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {SECURITY_PAGE.lede}
            </p>
          </Reveal>
        </div>
      </section>

      <section
        className="scroll-mt-24 px-6 pb-20 md:pb-28"
        aria-labelledby="security-cards-heading"
      >
        <h2 id="security-cards-heading" className="sr-only">
          How Chasum protects your business
        </h2>
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {SECURITY_CARDS.map((card, index) => {
            const Icon = ICONS[card.icon];
            return (
              <Reveal key={card.title} delayMs={Math.min(index * 40, 200)}>
                <article className="marketing-card-lift group flex h-full flex-col rounded-[1.35rem] border border-border/60 bg-card/80 p-6 md:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary transition-colors duration-300 group-hover:bg-primary/[0.12]">
                    <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                    {card.detail}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section
        className="scroll-mt-24 bg-muted/25 px-6 py-20 md:py-28"
        aria-labelledby="security-transparency-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2
              id="security-transparency-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {SECURITY_TRANSPARENCY.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {SECURITY_TRANSPARENCY.subtitle}
            </p>
          </Reveal>

          <ul className="mt-10 space-y-4 text-left">
            {SECURITY_TRANSPARENCY.points.map((point, index) => (
              <Reveal key={point} delayMs={Math.min(index * 40, 160)}>
                <li className="rounded-[1.25rem] border border-border/60 bg-card/80 px-5 py-4 text-sm leading-relaxed text-muted-foreground md:px-6 md:py-5 md:text-[15px]">
                  <span className="font-medium text-foreground">{point}</span>
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delayMs={120}>
            <p className="mt-8 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              {SECURITY_TRANSPARENCY.note}
            </p>
          </Reveal>
        </div>
      </section>

      <section
        className="scroll-mt-24 px-6 py-20 md:py-28"
        aria-labelledby="security-support-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2
              id="security-support-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {SECURITY_SUPPORT.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {SECURITY_SUPPORT.body}
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={STATUS_HREF}>
                <Button
                  size="lg"
                  className="marketing-cta-button h-12 rounded-full px-8"
                >
                  View System Status
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`${CONTACT_HREF}#support`}>
                <Button
                  variant="outline"
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
