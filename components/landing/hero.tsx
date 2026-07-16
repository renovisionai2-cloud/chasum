import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DEMO_HREF } from "@/lib/marketing/homepage";
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

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/signup">
              <Button size="lg" className="min-w-[150px]">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={DEMO_HREF}>
              <Button variant="outline" size="lg" className="min-w-[150px]">
                Book Demo
              </Button>
            </a>
            <Link href="/#showcase">
              <Button variant="ghost" size="lg" className="min-w-[150px]">
                <Play className="h-4 w-4" />
                Watch Product Tour
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required · Real product modules · Multi-tenant ready
          </p>
        </div>

        <div className="animate-fade-in-up animation-delay-200">
          <DashboardPreview variant="overview" />
        </div>
      </div>
    </section>
  );
}
