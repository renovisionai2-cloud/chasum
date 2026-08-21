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
  PRIVATE_ALPHA_AUDIENCE,
  PRIVATE_ALPHA_BENEFITS,
  PRIVATE_ALPHA_CLOSING,
  PRIVATE_ALPHA_COMMITMENT,
  PRIVATE_ALPHA_PAGE,
  PRIVATE_ALPHA_STARTING_SMALL,
  PRIVATE_ALPHA_STEPS,
} from "@/lib/marketing/resources-private-alpha";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Clock3,
  HandHelping,
  MessageCircle,
  Sparkles,
  Target,
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
  founder: Users,
};

const AUDIENCE_ICONS: Record<
  (typeof PRIVATE_ALPHA_AUDIENCE.cards)[number]["icon"],
  LucideIcon
> = {
  simplify: Target,
  feedback: MessageCircle,
  time: Clock3,
  future: Sparkles,
};

export function PrivateAlphaExperience() {
  const closingLines = PRIVATE_ALPHA_CLOSING.title.split("\n");

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Hero */}
      <section
        className="relative scroll-mt-24 px-6 pb-12 pt-28 md:pb-16 md:pt-36"
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
          </Reveal>
          <Reveal delayMs={60}>
            <div className="mx-auto mt-7 max-w-2xl space-y-4 text-lg leading-relaxed text-muted-foreground md:text-xl">
              {PRIVATE_ALPHA_PAGE.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why we're starting small */}
      <section
        className="scroll-mt-24 px-6 py-14 md:py-16"
        aria-labelledby="alpha-starting-small-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2
              id="alpha-starting-small-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {PRIVATE_ALPHA_STARTING_SMALL.title}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {PRIVATE_ALPHA_STARTING_SMALL.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* What Design Partners receive */}
      <section
        className="scroll-mt-24 bg-muted/25 px-6 py-14 md:py-20"
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
              <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
                {PRIVATE_ALPHA_BENEFITS.subtitle}
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 md:mt-12">
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

      {/* How it works — premium journey */}
      <section
        className="scroll-mt-24 px-6 py-14 md:py-20"
        aria-labelledby="alpha-steps-heading"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="alpha-steps-heading"
                className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
              >
                {PRIVATE_ALPHA_STEPS.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
                {PRIVATE_ALPHA_STEPS.subtitle}
              </p>
            </div>
          </Reveal>

          {/* Mobile / tablet: vertical connected timeline */}
          <ol className="relative mx-auto mt-10 max-w-xl space-y-4 md:mt-12 lg:hidden">
            <div
              className="pointer-events-none absolute bottom-6 left-[1.35rem] top-6 w-px bg-border/70"
              aria-hidden
            />
            {PRIVATE_ALPHA_STEPS.steps.map((item, index) => (
              <Reveal
                key={item.title}
                delayMs={Math.min(index * 40, 200)}
              >
                <li className="relative flex gap-4">
                  <span className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.08] text-base font-semibold text-primary">
                    {item.step}
                  </span>
                  <article className="marketing-card-lift flex-1 rounded-[1.25rem] border border-border/60 bg-card/80 p-5">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </article>
                </li>
              </Reveal>
            ))}
          </ol>

          {/* Large screens: connected card grid (3 × 2) */}
          <ol className="relative mt-12 hidden gap-x-5 gap-y-10 lg:grid lg:grid-cols-3">
            {/* Row connector lines */}
            <div
              className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[2.75rem] h-px bg-border/70"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[calc(50%+1.1rem)] h-px bg-border/70"
              aria-hidden
            />

            {PRIVATE_ALPHA_STEPS.steps.map((item, index) => (
              <Reveal
                key={item.title}
                delayMs={Math.min(index * 40, 200)}
              >
                <li className="relative flex h-full flex-col">
                  <div className="relative z-[1] mb-4 flex justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-background text-xl font-semibold text-primary ring-[6px] ring-background">
                      {item.step}
                    </span>
                  </div>
                  <article
                    className={cn(
                      "marketing-card-lift flex h-full flex-col rounded-[1.35rem] border border-border/60 bg-card/80 p-6 text-center",
                    )}
                  >
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                      {item.detail}
                    </p>
                  </article>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Who we're looking for */}
      <section
        className="scroll-mt-24 bg-muted/25 px-6 py-14 md:py-20"
        aria-labelledby="alpha-audience-heading"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="alpha-audience-heading"
                className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
              >
                {PRIVATE_ALPHA_AUDIENCE.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
                {PRIVATE_ALPHA_AUDIENCE.subtitle}
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:gap-6 md:mt-12">
            {PRIVATE_ALPHA_AUDIENCE.cards.map((card, index) => {
              const Icon = AUDIENCE_ICONS[card.icon];
              return (
                <Reveal
                  key={card.title}
                  delayMs={Math.min(index * 40, 160)}
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

      {/* Our commitment */}
      <section
        className="scroll-mt-24 px-6 py-14 md:py-16"
        aria-labelledby="alpha-commitment-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2
              id="alpha-commitment-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {PRIVATE_ALPHA_COMMITMENT.title}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {PRIVATE_ALPHA_COMMITMENT.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="scroll-mt-24 px-6 pb-20 pt-4 md:pb-28"
        aria-labelledby="alpha-closing-heading"
      >
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-border/60 bg-muted/30 px-6 py-12 text-center md:px-12 md:py-14">
            <h2
              id="alpha-closing-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {closingLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {PRIVATE_ALPHA_CLOSING.lede}
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
          </div>
        </Reveal>
      </section>
    </div>
  );
}
