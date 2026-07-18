import { DashboardPreview } from "@/components/landing/dashboard-preview";
import {
  ALPHA_BANNER,
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  DEMO_HREF,
} from "@/lib/marketing/alpha";
import { ArrowRight, Check, Play } from "lucide-react";
import Link from "next/link";

const TRUST_LINES = [
  "Private Alpha — limited partners",
  "Founder-backed support",
  "Built for service businesses",
] as const;

/**
 * V3 Hero — the software is the experience.
 * Monumental product stage, minimal chrome, emotional confidence.
 */
export function Hero() {
  return (
    <section
      className="marketing-hero marketing-v3-immersive relative isolate overflow-x-clip px-4 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-16 lg:pt-20"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col items-center">
        <p className="marketing-hero-enter mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-primary md:mb-8">
          AI Business Operating System · Private Alpha
        </p>

        <h1
          id="hero-heading"
          className="marketing-hero-enter marketing-hero-headline text-center font-semibold tracking-[-0.055em] text-foreground"
        >
          Run your business.
          <br />
          <span className="bg-gradient-to-br from-primary via-primary to-spark bg-clip-text text-transparent">
            Let AI handle the rest.
          </span>
        </h1>

        <div className="marketing-hero-enter marketing-hero-enter-delay-1 relative mt-10 w-full sm:mt-12 md:mt-14 lg:mt-16">
          <div className="marketing-hero-ambient pointer-events-none absolute left-1/2 top-[8%] h-[78%] w-[96%] -translate-x-1/2" />
          <div className="marketing-hero-stage mx-auto w-full max-w-[1420px]">
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
          <div className="marketing-hero-floor pointer-events-none absolute inset-x-[8%] bottom-0 h-20 md:h-28" />
        </div>

        <div className="marketing-hero-enter marketing-hero-enter-delay-2 mt-10 flex w-full max-w-3xl flex-col items-center md:mt-12">
          <p className="max-w-md text-center text-base text-muted-foreground md:text-lg">
            One operating system for scheduling, CRM, teams, and AI —
            built for service businesses. Currently inviting design partners.
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3.5">
            <Link href={APPLY_HREF} className="group">
              <span className="marketing-hero-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-10 text-[15px] font-semibold text-primary-foreground transition-[transform,box-shadow] duration-300 sm:w-auto sm:min-w-[10.5rem]">
                {CTA_APPLY_LABEL}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </Link>
            <a href={DEMO_HREF} className="group">
              <span className="marketing-hero-btn-secondary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-10 text-[15px] font-semibold text-foreground transition-[transform,background-color,border-color] duration-300 sm:w-auto sm:min-w-[10.5rem]">
                {CTA_DEMO_LABEL}
              </span>
            </a>
          </div>

          <Link
            href="/#showcase"
            className="marketing-focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-[13px] font-medium tracking-wide text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <Play className="h-3.5 w-3.5" />
            Experience the product
          </Link>

          <p className="mt-8 max-w-lg text-center text-[13px] text-muted-foreground">
            {ALPHA_BANNER}
          </p>

          <ul className="mt-6 flex flex-col items-center gap-2.5 sm:flex-row sm:gap-8">
            {TRUST_LINES.map((line) => (
              <li
                key={line}
                className="flex items-center gap-2 text-[13px] font-medium tracking-tight text-foreground/65"
              >
                <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.75} aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
