import { SparkMark } from "@/components/brand/marks";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { DEMO_HREF } from "@/lib/marketing/homepage";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section
      className="relative overflow-hidden px-6 py-28 md:py-40"
      aria-labelledby="final-cta-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-muted/30" />
        <div className="absolute inset-0 brand-glow opacity-80" />
        <div className="marketing-orb marketing-orb-primary absolute -left-24 top-1/3" />
        <div className="marketing-orb marketing-orb-spark absolute -right-16 bottom-0" />
      </div>

      <Reveal>
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card/80 text-primary shadow-sm backdrop-blur-sm">
            <SparkMark className="h-7 w-7" />
          </div>
          <h2
            id="final-cta-heading"
            className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-[1.1]"
          >
            Your business deserves an operating system.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Start free with the real product — CRM, calendar, reports, billing,
            and Emma — or book a demo with our team.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button
                size="lg"
                className="marketing-cta-button min-w-[200px] shadow-md shadow-primary/25"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={DEMO_HREF}>
              <Button
                variant="outline"
                size="lg"
                className="marketing-cta-button min-w-[200px] bg-background/70 backdrop-blur-sm"
              >
                Book Demo
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required · Cancel anytime
          </p>
        </div>
      </Reveal>
    </section>
  );
}
