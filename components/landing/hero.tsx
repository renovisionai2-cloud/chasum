import { AnimatedNumber } from "@/components/landing/animated-number";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DEMO_HREF, HERO_STATS } from "@/lib/marketing/homepage";
import {
  ArrowRight,
  Check,
  CreditCard,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const TRUST_BADGES = [
  { label: "No credit card", icon: CreditCard },
  { label: "Tenant-safe data", icon: ShieldCheck },
  { label: "Real product access", icon: Sparkles },
] as const;

/**
 * Phase 1 visual redesign — centered, product-first composition.
 * Same messaging, brand, and colors; elevated hierarchy and craft.
 */
export function Hero() {
  return (
    <section className="marketing-hero relative isolate overflow-hidden px-6 pb-24 pt-14 md:pb-32 md:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10 brand-glow" />
      <div className="marketing-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
      <div className="marketing-orb marketing-orb-primary pointer-events-none absolute left-1/2 top-24 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 opacity-30" />
      <div className="marketing-orb marketing-orb-spark pointer-events-none absolute -right-10 bottom-10 -z-10 opacity-25" />

      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        {/* Brand signal — nav already carries logo; keep a quiet mark here */}
        <div className="animate-fade-in-up mb-10 md:mb-12">
          <Logo size="md" href={null} priority />
        </div>

        {/* 1. Headline */}
        <h1 className="animate-fade-in-up max-w-5xl text-balance text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[0.98]">
          Run Your Business.
          <br />
          <span className="bg-gradient-to-r from-primary to-spark bg-clip-text text-transparent">
            Let AI Handle The Rest.
          </span>
        </h1>

        {/* Subhead */}
        <p className="animate-fade-in-up animation-delay-100 mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:mt-8 md:text-xl md:leading-relaxed">
          The AI Business Operating System built for service businesses.
        </p>

        {/* 2. Product — treated as the hero visual */}
        <div className="animate-fade-in-up animation-delay-200 relative mt-12 w-full max-w-5xl md:mt-16">
          <div className="marketing-hero-product-light pointer-events-none absolute inset-x-8 -top-8 bottom-1/3 -z-10 rounded-full opacity-80" />
          <div className="marketing-hero-product">
            <DashboardPreview
              variant="overview"
              animated
              live
              className="marketing-hero-dashboard border-border/50 bg-card/90 shadow-[0_40px_100px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm"
            />
          </div>
        </div>

        {/* 3. CTAs */}
        <div className="animate-fade-in-up animation-delay-300 mt-12 flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4 md:mt-14">
          <Link href="/signup">
            <Button
              size="lg"
              className="marketing-cta-button group h-14 w-full min-w-[200px] px-8 text-base shadow-lg shadow-primary/25 sm:w-auto"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href={DEMO_HREF}>
            <Button
              variant="outline"
              size="lg"
              className="marketing-cta-button h-14 w-full min-w-[200px] px-8 text-base bg-background/70 backdrop-blur-sm sm:w-auto"
            >
              Book Demo
            </Button>
          </a>
        </div>
        <Link
          href="/#showcase"
          className="animate-fade-in-up animation-delay-300 mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Play className="h-4 w-4" />
          Watch Product Tour
        </Link>

        {/* 4. Trust */}
        <div className="animate-fade-in-up animation-delay-400 mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:mt-14">
          {TRUST_BADGES.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 text-sm font-medium text-foreground/80"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </div>
          ))}
        </div>

        <dl className="animate-fade-in-up animation-delay-400 mx-auto mt-10 grid w-full max-w-3xl grid-cols-3 gap-3 md:mt-12 md:gap-5">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              className="marketing-stat-card rounded-[var(--radius-lg)] border border-border/60 bg-card/80 px-3 py-5 text-center backdrop-blur-md md:px-5 md:py-6"
            >
              <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums tracking-tight md:text-3xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </dd>
            </div>
          ))}
        </dl>

        <p className="animate-fade-in-up animation-delay-400 mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground md:mt-10">
          <Check className="h-4 w-4 text-success" />
          Setup takes minutes. Upgrade only when you are ready.
        </p>
      </div>
    </section>
  );
}
