"use client";

import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  DEMO_HREF,
} from "@/lib/marketing/alpha";
import {
  PRIVATE_ALPHA_BENEFITS,
  PRIVATE_ALPHA_CLOSING,
  PRIVATE_ALPHA_PAGE,
  PRIVATE_ALPHA_STEPS,
  PRIVATE_ALPHA_STORY,
} from "@/lib/marketing/resources-private-alpha";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  HandHelping,
  MessageCircle,
  Sparkles,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const BENEFIT_ICONS: Record<
  (typeof PRIVATE_ALPHA_BENEFITS.cards)[number]["icon"],
  LucideIcon
> = {
  early: Zap,
  influence: MessageCircle,
  support: HandHelping,
  onboarding: UserRound,
  summer: Sparkles,
  terms: Users,
};

export function PrivateAlphaExperience() {
  return (
    <div className="relative overflow-hidden bg-background">
      <section
        className="relative scroll-mt-24 px-6 pb-16 pt-28 md:pb-24 md:pt-36"
        aria-labelledby="private-alpha-heading"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_72%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="marketing-eyebrow">{PRIVATE_ALPHA_PAGE.eyebrow}</p>
            <h1
              id="private-alpha-heading"
              className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl"
            >
              {PRIVATE_ALPHA_PAGE.headline}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {PRIVATE_ALPHA_PAGE.lede}
            </p>
          </Reveal>
          <Reveal delayMs={60}>
            <div className="mx-auto mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {PRIVATE_ALPHA_STORY.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="scroll-mt-24 bg-muted/25 px-6 py-20 md:py-28"
        aria-labelledby="alpha-benefits-heading"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="alpha-benefits-heading"
                className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
              >
                {PRIVATE_ALPHA_BENEFITS.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                {PRIVATE_ALPHA_BENEFITS.subtitle}
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 md:mt-16">
            {PRIVATE_ALPHA_BENEFITS.cards.map((card, index) => {
              const Icon = BENEFIT_ICONS[card.icon];
              return (
                <Reveal
                  key={card.title}
                  delayMs={Math.min(index * 40, 200)}
                >
                  <article className="marketing-card-lift group flex h-full flex-col rounded-[1.35rem] border border-border/60 bg-card/80 p-6 md:p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary transition-colors duration-300 group-hover:bg-primary/[0.12]">
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={1.6}
                        aria-hidden
                      />
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
        </div>
      </section>

      <section
        className="scroll-mt-24 px-6 py-20 md:py-28"
        aria-labelledby="alpha-steps-heading"
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center">
              <h2
                id="alpha-steps-heading"
                className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
              >
                {PRIVATE_ALPHA_STEPS.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                {PRIVATE_ALPHA_STEPS.subtitle}
              </p>
            </div>
          </Reveal>

          <ol className="mt-14 space-y-0">
            {PRIVATE_ALPHA_STEPS.steps.map((item, index) => (
              <Reveal
                key={item.title}
                delayMs={Math.min(index * 40, 200)}
              >
                <li
                  className={cn(
                    "relative flex gap-5 pb-10 last:pb-0 md:gap-7",
                    index < PRIVATE_ALPHA_STEPS.steps.length - 1 &&
                      "before:absolute before:bottom-0 before:left-[1.15rem] before:top-12 before:w-px before:bg-border/80",
                  )}
                >
                  <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-sm font-semibold text-foreground md:h-10 md:w-10">
                    {item.step}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                      {item.detail}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="scroll-mt-24 px-6 pb-24 pt-8 md:pb-32"
        aria-labelledby="alpha-closing-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2
              id="alpha-closing-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {PRIVATE_ALPHA_CLOSING.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {PRIVATE_ALPHA_CLOSING.lede}
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={APPLY_HREF}>
                <Button
                  size="lg"
                  className="marketing-cta-button h-12 rounded-full px-8"
                >
                  {CTA_APPLY_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={DEMO_HREF}>
                <Button
                  variant="outline"
                  size="lg"
                  className="marketing-cta-button h-12 rounded-full px-8"
                >
                  {CTA_DEMO_LABEL}
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
