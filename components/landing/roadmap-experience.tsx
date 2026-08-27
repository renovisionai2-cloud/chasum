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
  ROADMAP_CLOSING,
  ROADMAP_HERO,
  ROADMAP_STAGES,
  ROADMAP_STATUS_ORDER,
  roadmapItemsByStatus,
  type RoadmapIcon,
  type RoadmapItem,
  type RoadmapStatus,
} from "@/lib/marketing/roadmap";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Gift,
  Heart,
  KeyRound,
  LayoutDashboard,
  Layers3,
  MapPin,
  Megaphone,
  MessageSquare,
  Network,
  Package,
  PhoneCall,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const ICONS: Record<RoadmapIcon, LucideIcon> = {
  booking: CalendarDays,
  calendar: CalendarClock,
  customers: Users,
  team: UsersRound,
  locations: MapPin,
  payments: Receipt,
  gift: Gift,
  memberships: Layers3,
  communications: MessageSquare,
  reports: BarChart3,
  command: LayoutDashboard,
  summer: Sparkles,
  reliability: ShieldCheck,
  commerce: CreditCard,
  mobile: Smartphone,
  access: KeyRound,
  automation: Workflow,
  phone: PhoneCall,
  inventory: Package,
  payroll: Wallet,
  campaigns: Megaphone,
  franchise: Building2,
  loyalty: Heart,
  marketplace: Network,
  intelligence: TrendingUp,
};

function FeatureCard({
  item,
  delayMs,
}: {
  item: RoadmapItem;
  delayMs: number;
}) {
  const Icon = ICONS[item.icon];

  return (
    <Reveal delayMs={delayMs}>
      <article
        className={cn(
          "roadmap-card marketing-card-lift group flex h-full min-w-0 flex-col rounded-[1.35rem] border p-6 md:p-7",
          item.status === "private_alpha" && "border-border/70 bg-card/90",
          item.status === "in_development" && "border-primary/20 bg-card/85",
          item.status === "coming_next" && "border-border/50 bg-card/70",
          item.status === "future_direction" && "border-border/40 bg-muted/30",
        )}
        data-status={item.status}
      >
        <span
          className={cn(
            "roadmap-card-icon flex h-11 w-11 items-center justify-center rounded-2xl",
            item.status === "private_alpha" && "bg-primary/[0.08] text-primary",
            item.status === "in_development" && "bg-primary/[0.12] text-primary",
            item.status === "coming_next" && "bg-primary/[0.06] text-primary",
            item.status === "future_direction" && "bg-muted text-primary/80",
          )}
          data-status={item.status}
        >
          <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
        </span>
        <h3 className="roadmap-card-title mt-5 text-lg font-semibold tracking-tight text-balance break-words text-foreground">
          {item.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {item.description}
        </p>
        {item.qualification ? (
          <p className="roadmap-card-note mt-3 text-xs leading-relaxed text-muted-foreground">
            {item.qualification}
          </p>
        ) : null}
      </article>
    </Reveal>
  );
}

function FeatureSection({
  status,
  tone = "default",
}: {
  status: RoadmapStatus;
  tone?: "default" | "soft";
}) {
  const stage = ROADMAP_STAGES[status];
  const items = roadmapItemsByStatus(status);
  const compact = items.length <= 2;

  return (
    <section
      id={stage.id}
      className={cn(
        "roadmap-section scroll-mt-24 px-6 py-20 md:py-28",
        tone === "soft" && "bg-muted/25",
      )}
      data-status={status}
      aria-labelledby={`${stage.id}-heading`}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id={`${stage.id}-heading`}
              className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl"
            >
              {stage.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              {stage.subtitle}
            </p>
          </div>
        </Reveal>

        <div
          className={cn(
            "mt-12 grid gap-5 sm:grid-cols-2 md:mt-16 lg:gap-6",
            compact
              ? "mx-auto max-w-4xl lg:grid-cols-2"
              : "lg:grid-cols-3",
          )}
        >
          {items.map((item, index) => (
            <FeatureCard
              key={item.id}
              item={item}
              delayMs={Math.min(index * 40, 200)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Public Roadmap — product-truth maturity, business-owner first.
 */
export function RoadmapExperience() {
  return (
    <div className="roadmap-page relative overflow-x-clip bg-background">
      <section
        className="relative scroll-mt-24 px-6 pb-16 pt-28 md:pb-24 md:pt-36"
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

          <Reveal delayMs={60}>
            <nav
              className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-x-1 gap-y-2 md:max-w-none md:gap-x-2"
              aria-label="Roadmap stages"
            >
              {ROADMAP_STATUS_ORDER.map((status, index) => {
                const stage = ROADMAP_STAGES[status];
                return (
                  <span
                    key={status}
                    className="inline-flex min-w-0 items-center"
                  >
                    {index > 0 ? (
                      <span
                        className="mx-1 hidden h-px w-3 shrink-0 bg-border md:mx-2 md:block"
                        aria-hidden
                      />
                    ) : null}
                    <a
                      href={`#${stage.id}`}
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground no-underline transition-colors hover:bg-muted/70 hover:text-foreground",
                        status === "private_alpha" && "text-foreground",
                        status === "in_development" && "text-primary",
                      )}
                      aria-label={stage.title}
                    >
                      {stage.navLabel}
                    </a>
                  </span>
                );
              })}
            </nav>
          </Reveal>
        </div>
      </section>

      <FeatureSection status="private_alpha" />
      <FeatureSection status="in_development" tone="soft" />
      <FeatureSection status="coming_next" />
      <FeatureSection status="future_direction" tone="soft" />

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
