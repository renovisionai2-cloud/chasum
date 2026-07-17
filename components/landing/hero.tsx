import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Button } from "@/components/ui/button";
import { DEMO_HREF } from "@/lib/marketing/homepage";
import { ArrowRight, Check, Play } from "lucide-react";
import Link from "next/link";

const TRUST_LINES = [
  "No credit card",
  "Enterprise security",
  "Built for real service businesses",
] as const;

/**
 * World-class hero — product-dominant, centered, billion-dollar craft.
 * Brand colors and core messaging preserved; visual experience rebuilt.
 */
export function Hero() {
  return (
    <section className="marketing-hero relative isolate overflow-hidden px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24">
      {/* Soft white + blue atmosphere — no busy graphics */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background" />
      <div className="marketing-hero-atmosphere pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center text-center">
        {/* Headline — commands the page */}
        <h1 className="marketing-hero-enter max-w-[18ch] text-balance text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.05em] text-foreground sm:text-6xl md:text-7xl lg:text-[5.75rem] lg:leading-[0.96] xl:text-[6rem]">
          Run Your Business.
          <br />
          <span className="bg-gradient-to-r from-primary to-spark bg-clip-text text-transparent">
            Let AI Handle The Rest.
          </span>
        </h1>

        {/* One confident sentence */}
        <p className="marketing-hero-enter marketing-hero-enter-delay-1 mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:mt-8 md:text-xl md:leading-relaxed">
          The AI Business Operating System built for service businesses.
        </p>

        {/* Product — the true hero */}
        <div className="marketing-hero-enter marketing-hero-enter-delay-2 relative mt-10 w-full md:mt-14">
          <div className="marketing-hero-glow pointer-events-none absolute inset-x-[8%] -top-6 bottom-[35%] -z-10" />
          <div className="marketing-hero-stage">
            <DashboardPreview
              variant="overview"
              animated
              live
              hero
              className="marketing-hero-frame"
            />
          </div>
        </div>

        {/* CTAs — two only */}
        <div className="marketing-hero-enter marketing-hero-enter-delay-3 mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-12 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <Link href="/signup" className="sm:inline-flex">
            <Button
              size="lg"
              className="marketing-cta-button group h-14 w-full px-10 text-[15px] shadow-lg shadow-primary/20 sm:w-auto"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href={DEMO_HREF} className="sm:inline-flex">
            <Button
              variant="outline"
              size="lg"
              className="marketing-cta-button h-14 w-full border-border/80 bg-background/80 px-10 text-[15px] backdrop-blur-sm sm:w-auto"
            >
              Book Demo
            </Button>
          </a>
        </div>

        <Link
          href="/#showcase"
          className="marketing-hero-enter marketing-hero-enter-delay-3 mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <Play className="h-3.5 w-3.5" />
          Watch Product Tour
        </Link>

        {/* Trust — immediately under CTA */}
        <ul className="marketing-hero-enter marketing-hero-enter-delay-4 mt-10 flex flex-col items-center gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-3">
          {TRUST_LINES.map((line) => (
            <li
              key={line}
              className="flex items-center gap-2 text-sm font-medium text-foreground/75 md:text-[15px]"
            >
              <Check
                className="h-4 w-4 shrink-0 text-primary"
                strokeWidth={2.5}
                aria-hidden
              />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
