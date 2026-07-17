import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { DEMO_HREF } from "@/lib/marketing/homepage";
import { ArrowRight, Check, Play } from "lucide-react";
import Link from "next/link";

const TRUST_LINES = [
  "No credit card",
  "Enterprise security",
  "Built for real service businesses",
] as const;

/**
 * Apple-keynote hero — monumental type, cinematic product, quiet confidence.
 * Rebuilt from scratch; not an iteration of the prior layout.
 */
export function Hero() {
  return (
    <section className="marketing-hero relative isolate overflow-x-clip px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20 lg:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-background" />
      <div className="marketing-hero-keynote-bg pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center">
        {/* 1. Headline */}
        <h1 className="marketing-hero-enter marketing-hero-headline text-center font-semibold tracking-[-0.055em] text-foreground">
          Run Your Business.
          <br />
          <span className="bg-gradient-to-br from-primary via-primary to-spark bg-clip-text text-transparent">
            Let AI Handle The Rest.
          </span>
        </h1>

        {/* 2. Product */}
        <div className="marketing-hero-enter marketing-hero-enter-delay-1 relative mt-8 w-full sm:mt-10 md:mt-12 lg:mt-14">
          <div className="marketing-hero-ambient pointer-events-none absolute left-1/2 top-[12%] h-[70%] w-[92%] -translate-x-1/2" />
          <div className="marketing-hero-stage mx-auto w-full max-w-[1360px]">
            <div className="marketing-hero-perspective">
              <div className="marketing-hero-bezel">
                <DashboardPreview
                  variant="overview"
                  animated
                  live
                  hero
                  className="marketing-hero-surface"
                />
              </div>
            </div>
          </div>
          <div className="marketing-hero-floor pointer-events-none absolute inset-x-[10%] bottom-0 h-16 md:h-24" />
        </div>

        {/* Quiet supporting line — after product so it never competes */}
        <p className="marketing-hero-enter marketing-hero-enter-delay-2 mt-8 max-w-lg text-center text-base text-muted-foreground md:mt-10 md:text-lg">
          The AI Business Operating System built for service businesses.
        </p>

        {/* 3. CTA */}
        <div className="marketing-hero-enter marketing-hero-enter-delay-3 mt-8 flex w-full flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:items-center sm:gap-3.5">
          <Link href="/signup" className="group">
            <span className="marketing-hero-btn-primary inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full px-9 text-[15px] font-semibold text-primary-foreground transition-[transform,box-shadow] duration-300 sm:w-auto">
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </Link>
          <a href={DEMO_HREF} className="group">
            <span className="marketing-hero-btn-secondary inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full px-9 text-[15px] font-semibold text-foreground transition-[transform,background-color,border-color] duration-300 sm:w-auto">
              Book Demo
            </span>
          </a>
        </div>

        <Link
          href="/#showcase"
          className="marketing-hero-enter marketing-hero-enter-delay-3 mt-5 inline-flex items-center gap-2 text-[13px] font-medium tracking-wide text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <Play className="h-3.5 w-3.5" />
          Watch Product Tour
        </Link>

        {/* 4. Trust */}
        <ul className="marketing-hero-enter marketing-hero-enter-delay-4 mt-9 flex flex-col items-center gap-2.5 sm:mt-10 sm:flex-row sm:gap-8">
          {TRUST_LINES.map((line) => (
            <li
              key={line}
              className="flex items-center gap-2 text-[13px] font-medium tracking-tight text-foreground/70"
            >
              <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.75} aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
