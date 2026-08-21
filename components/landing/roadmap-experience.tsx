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
  ROADMAP_AVAILABLE_TODAY,
  ROADMAP_CLOSING,
  ROADMAP_COMING_SOON,
  ROADMAP_FUTURE_VISION,
  ROADMAP_HERO,
  type RoadmapCard,
} from "@/lib/marketing/roadmap";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Gift,
  Globe2,
  Heart,
  Layers3,
  Mail,
  Megaphone,
  MessageSquare,
  Network,
  Package,
  Phone,
  PhoneCall,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const ICONS: Record<RoadmapCard["icon"], LucideIcon> = {
  booking: CalendarDays,
  calendar: CalendarClock,
  customers: Users,
  summer: Sparkles,
  payments: CreditCard,
  gift: Gift,
  email: Mail,
  calls: Phone,
  sms: MessageSquare,
  phone: PhoneCall,
  automation: Workflow,
  inventory: Package,
  payroll: Wallet,
  campaigns: Megaphone,
  memberships: Layers3,
  mobile: Smartphone,
  insights: TrendingUp,
  locations: Store,
  franchise: Building2,
  loyalty: Heart,
  marketplace: Network,
};

function FeatureCard({
  card,
  delayMs,
}: {
  card: RoadmapCard;
  delayMs: number;
}) {
  const Icon = ICONS[card.icon] ?? Globe2;

  return (
    <Reveal delayMs={delayMs}>
      <article
        className={cn(
          "marketing-card-lift group flex h-full flex-col rounded-[1.35rem] border border-border/60 bg-card/80 p-6 md:p-7",
        )}
      >
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
}

function FeatureSection({
  id,
  title,
  subtitle,
  cards,
  tone = "default",
}: {
  id: string;
  title: string;
  subtitle: string;
  cards: readonly RoadmapCard[];
  tone?: "default" | "soft";
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 px-6 py-20 md:py-28",
        tone === "soft" && "bg-muted/25",
      )}
      aria-labelledby={`${id}-heading`}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id={`${id}-heading`}
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 md:mt-16">
          {cards.map((card, index) => (
            <FeatureCard
              key={card.title}
              card={card}
              delayMs={Math.min(index * 40, 200)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Public Roadmap — premium, inspirational, business-owner first.
 */
export function RoadmapExperience() {
  return (
    <div className="relative overflow-hidden bg-background">
      {/* Hero */}
      <section
        className="relative scroll-mt-24 px-6 pb-20 pt-28 md:pb-28 md:pt-36"
        aria-labelledby="roadmap-heading"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-spark/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="marketing-eyebrow">{ROADMAP_HERO.eyebrow}</p>
            <h1
              id="roadmap-heading"
              className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl"
            >
              {ROADMAP_HERO.headline}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {ROADMAP_HERO.lede}
            </p>
          </Reveal>
        </div>
      </section>

      <FeatureSection
        id="available-today"
        title={ROADMAP_AVAILABLE_TODAY.title}
        subtitle={ROADMAP_AVAILABLE_TODAY.subtitle}
        cards={ROADMAP_AVAILABLE_TODAY.cards}
      />

      <FeatureSection
        id="coming-soon"
        title={ROADMAP_COMING_SOON.title}
        subtitle={ROADMAP_COMING_SOON.subtitle}
        cards={ROADMAP_COMING_SOON.cards}
        tone="soft"
      />

      <FeatureSection
        id="future-vision"
        title={ROADMAP_FUTURE_VISION.title}
        subtitle={ROADMAP_FUTURE_VISION.subtitle}
        cards={ROADMAP_FUTURE_VISION.cards}
      />

      {/* Built with customers */}
      <section
        id="built-with-customers"
        className="relative scroll-mt-24 overflow-hidden px-6 py-24 md:py-32"
        aria-labelledby="roadmap-closing-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_68%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.07]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="marketing-eyebrow">Partnership</p>
            <h2
              id="roadmap-closing-heading"
              className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {ROADMAP_CLOSING.title}
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              {ROADMAP_CLOSING.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
