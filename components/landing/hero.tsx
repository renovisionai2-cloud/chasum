import { AnimatedNumber } from "@/components/landing/animated-number";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DEMO_HREF, HERO_STATS } from "@/lib/marketing/homepage";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-14 md:pb-24 md:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10 brand-glow" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div className="animate-fade-in-up text-center lg:text-left">
          <div className="mb-6 flex justify-center lg:justify-start">
            <Logo size="lg" href={null} withTagline priority />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-[3.25rem] md:leading-[1.08]">
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
              <Button size="lg" className="w-full min-w-[160px] shadow-md shadow-primary/20">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={DEMO_HREF} className="sm:order-2">
              <Button variant="outline" size="lg" className="w-full min-w-[160px]">
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

          <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-3 lg:mx-0 lg:max-w-none">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-md)] border border-border/70 bg-card/80 px-3 py-3 text-center backdrop-blur-sm"
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

          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required · Real product modules · Multi-tenant ready
          </p>
        </div>

        <div className="animate-fade-in-up animation-delay-200">
          <DashboardPreview variant="overview" animated />
        </div>
      </div>
    </section>
  );
}
