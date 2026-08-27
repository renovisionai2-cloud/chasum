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

/** Visual hierarchy only — does not change product-truth status. */
const PRIVATE_ALPHA_ANCHOR_IDS = [
  "online-booking",
  "calendar-scheduling",
  "command-centre",
  "summer",
] as const;

type CardDensity = "anchor" | "support" | "focus" | "next" | "future";

function FeatureCard({
  item,
  delayMs,
  density,
}: {
  item: RoadmapItem;
  delayMs: number;
  density: CardDensity;
}) {
  const Icon = ICONS[item.icon];
  const compact = density === "support" || density === "future";
  const focus = density === "focus";

  return (
    <Reveal delayMs={delayMs} className="h-full min-w-0">
      <article
        className={cn(
          "roadmap-card group flex h-full min-w-0 border",
          density !== "future" && "marketing-card-lift",
          focus
            ? "flex-col rounded-[1.5rem] p-7 sm:flex-row sm:items-start sm:gap-6 sm:p-8 md:p-9"
            : "flex-col",
          density === "anchor" &&
            "rounded-[1.35rem] border-border/80 bg-card p-6 md:p-7",
          density === "support" &&
            "rounded-[1.15rem] border-border/55 bg-card/75 p-5",
          density === "focus" &&
            "border-primary/20 bg-card shadow-[0_1px_0_color-mix(in_srgb,var(--primary)_8%,transparent)]",
          density === "next" &&
            "rounded-[1.25rem] border-border/45 bg-card/60 p-5 md:p-6",
          density === "future" &&
            "rounded-[0.9rem] border-border/30 bg-muted/40 p-3.5 md:p-4",
        )}
        data-status={item.status}
        data-density={density}
      >
        <span
          className={cn(
            "roadmap-card-icon flex shrink-0 items-center justify-center rounded-2xl",
            density === "anchor" &&
              "h-11 w-11 bg-primary/[0.08] text-primary",
            density === "support" &&
              "h-9 w-9 rounded-xl bg-primary/[0.06] text-primary",
            density === "focus" &&
              "h-12 w-12 bg-primary/[0.12] text-primary",
            density === "next" &&
              "h-10 w-10 bg-primary/[0.05] text-primary/90",
            density === "future" &&
              "h-8 w-8 rounded-xl bg-muted text-primary/75",
          )}
        >
          <Icon
            className={cn(
              density === "future" ? "h-4 w-4" : "h-5 w-5",
              density === "support" && "h-4 w-4",
            )}
            strokeWidth={1.6}
            aria-hidden
          />
        </span>
        <div className={cn("min-w-0", !focus && "flex flex-1 flex-col")}>
          <h3
            className={cn(
              "roadmap-card-title font-semibold tracking-tight text-balance break-words text-foreground",
              density === "anchor" && "mt-5 text-lg md:text-xl",
              density === "support" && "mt-4 text-[15px]",
              density === "focus" && "mt-5 text-lg sm:mt-0 md:text-xl",
              density === "next" && "mt-4 text-base md:text-lg",
              density === "future" && "mt-2.5 text-sm font-medium",
            )}
          >
            {item.title}
          </h3>
          <p
            className={cn(
              "leading-relaxed text-muted-foreground",
              compact ? "mt-1.5 text-sm" : "mt-2 text-sm md:text-[15px]",
              density === "future" && "mt-1 text-[13px] leading-snug",
              density === "focus" && "mt-2 md:text-[15px]",
            )}
          >
            {item.description}
          </p>
          {item.qualification ? (
            <p
              className={cn(
                "roadmap-card-note leading-relaxed text-muted-foreground",
                density === "future" ? "mt-2 text-[11px]" : "mt-3 text-xs",
              )}
            >
              {item.qualification}
            </p>
          ) : null}
        </div>
      </article>
    </Reveal>
  );
}

function StageIntro({
  status,
  quiet = false,
}: {
  status: RoadmapStatus;
  quiet?: boolean;
}) {
  const stage = ROADMAP_STAGES[status];

  return (
    <Reveal>
      <div className={cn("mx-auto text-center", quiet ? "max-w-xl" : "max-w-2xl")}>
        <h2
          id={`${stage.id}-heading`}
          className={cn(
            "text-balance font-semibold tracking-[-0.035em] text-foreground",
            quiet
              ? "text-2xl md:text-3xl"
              : "text-3xl md:text-4xl",
          )}
        >
          {stage.title}
        </h2>
        <p
          className={cn(
            "mt-4 leading-relaxed text-muted-foreground",
            quiet ? "text-sm md:text-base" : "text-base md:text-lg",
          )}
        >
          {stage.subtitle}
        </p>
      </div>
    </Reveal>
  );
}

function ClusterLabel({ children }: { children: string }) {
  return (
    <p className="roadmap-cluster-label text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function AvailableSection() {
  const stage = ROADMAP_STAGES.private_alpha;
  const items = roadmapItemsByStatus("private_alpha");
  const anchors = PRIVATE_ALPHA_ANCHOR_IDS.map(
    (id) => items.find((item) => item.id === id),
  ).filter((item): item is RoadmapItem => Boolean(item));
  const supporting = items.filter(
    (item) =>
      !PRIVATE_ALPHA_ANCHOR_IDS.includes(
        item.id as (typeof PRIVATE_ALPHA_ANCHOR_IDS)[number],
      ),
  );

  return (
    <section
      id={stage.id}
      className="roadmap-section scroll-mt-24 px-6 pb-10 pt-16 md:pb-12 md:pt-20"
      data-status="private_alpha"
      aria-labelledby={`${stage.id}-heading`}
    >
      <div className="mx-auto max-w-6xl">
        <StageIntro status="private_alpha" />

        <div className="mt-12 md:mt-14">
          <ClusterLabel>The operating day</ClusterLabel>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:gap-6">
            {anchors.map((item, index) => (
              <FeatureCard
                key={item.id}
                item={item}
                density="anchor"
                delayMs={Math.min(index * 40, 160)}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 md:mt-14">
          <ClusterLabel>Connected around it</ClusterLabel>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {supporting.map((item, index) => (
              <FeatureCard
                key={item.id}
                item={item}
                density="support"
                delayMs={Math.min(index * 30, 160)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InDevelopmentSection() {
  const stage = ROADMAP_STAGES.in_development;
  const items = roadmapItemsByStatus("in_development");

  return (
    <section
      id={stage.id}
      className="roadmap-section scroll-mt-24 bg-muted/30 px-6 pb-14 pt-10 md:pb-16 md:pt-12"
      data-status="in_development"
      aria-labelledby={`${stage.id}-heading`}
    >
      <div className="mx-auto max-w-5xl">
        <StageIntro status="in_development" />
        <div className="roadmap-focus-band mt-10 rounded-[1.75rem] border border-primary/10 bg-background/70 p-4 md:mt-12 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {items.map((item, index) => (
              <FeatureCard
                key={item.id}
                item={item}
                density="focus"
                delayMs={Math.min(index * 40, 120)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComingNextSection() {
  const stage = ROADMAP_STAGES.coming_next;
  const items = roadmapItemsByStatus("coming_next");

  return (
    <section
      id={stage.id}
      className="roadmap-section scroll-mt-24 px-6 py-14 md:py-20"
      data-status="coming_next"
      aria-labelledby={`${stage.id}-heading`}
    >
      <div className="mx-auto max-w-5xl">
        <StageIntro status="coming_next" quiet />
        <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
          {items.map((item, index) => (
            <FeatureCard
              key={item.id}
              item={item}
              density="next"
              delayMs={Math.min(index * 40, 120)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FutureDirectionSection() {
  const stage = ROADMAP_STAGES.future_direction;
  const items = roadmapItemsByStatus("future_direction");

  return (
    <section
      id={stage.id}
      className="roadmap-section scroll-mt-24 px-6 py-12 md:py-16"
      data-status="future_direction"
      aria-labelledby={`${stage.id}-heading`}
    >
      <div className="mx-auto max-w-6xl">
        <StageIntro status="future_direction" quiet />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-10 md:grid-cols-3 md:gap-3.5">
          {items.map((item, index) => (
            <FeatureCard
              key={item.id}
              item={item}
              density="future"
              delayMs={Math.min(index * 20, 120)}
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
        className="relative scroll-mt-24 px-6 pb-12 pt-28 md:pb-16 md:pt-36"
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

      <AvailableSection />
      <InDevelopmentSection />
      <ComingNextSection />
      <FutureDirectionSection />

      <section
        id="built-with-customers"
        className="relative scroll-mt-24 overflow-hidden px-6 py-20 md:py-28"
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
