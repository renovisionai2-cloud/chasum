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

export function Hero() {
  return (
    <section className="marketing-hero relative isolate overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10 brand-glow" />
      <div className="marketing-hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="marketing-orb marketing-orb-primary pointer-events-none absolute -left-24 top-20 -z-10" />
      <div className="marketing-orb marketing-orb-spark pointer-events-none absolute -right-20 bottom-16 -z-10" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="animate-fade-in-up text-center lg:text-left">
          <div className="mb-6 flex justify-center lg:justify-start">
            <Logo size="lg" href={null} withTagline priority />
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl md:text-[3.7rem] md:leading-[1.02]">
            Run Your Business.
            <br />
            <span className="bg-gradient-to-r from-primary to-spark bg-clip-text text-transparent">
              Let AI Handle The Rest.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            The AI Business Operating System built for service businesses.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <Link href="/signup" className="sm:order-1">
              <Button
                size="lg"
                className="marketing-cta-button group w-full min-w-[160px] shadow-md shadow-primary/20"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href={DEMO_HREF} className="sm:order-2">
              <Button
                variant="outline"
                size="lg"
                className="marketing-cta-button w-full min-w-[160px] bg-background/65 backdrop-blur-sm"
              >
                Book Demo
              </Button>
            </a>
            <Link href="/#showcase" className="sm:order-3">
              <Button variant="ghost" size="lg" className="w-full text-muted-foreground">
                <Play className="h-4 w-4" />
                Watch Product Tour
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
            {TRUST_BADGES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-3 w-3" />
                </span>
                {label}
              </div>
            ))}
          </div>

          <dl className="mx-auto mt-9 grid max-w-md grid-cols-3 gap-3 lg:mx-0 lg:max-w-none">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="marketing-stat-card rounded-[var(--radius-md)] border border-border/70 bg-card/75 px-3 py-4 text-center backdrop-blur-md"
              >
                <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
            <Check className="h-3.5 w-3.5 text-success" />
            Setup takes minutes. Upgrade only when you are ready.
          </p>
        </div>

        <div className="animate-fade-in-up animation-delay-200 lg:-mr-12">
          <div className="marketing-dashboard-stage">
            <DashboardPreview
              variant="overview"
              animated
              className="shadow-2xl shadow-primary/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
