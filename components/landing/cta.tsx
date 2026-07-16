import { SparkMark } from "@/components/brand/marks";
import { Button } from "@/components/ui/button";
import { DEMO_HREF } from "@/lib/marketing/homepage";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="px-6 py-20 md:py-28" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-primary px-8 py-16 text-center shadow-lg md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-primary-foreground">
            <SparkMark className="h-6 w-6" />
          </div>
          <h2
            id="final-cta-heading"
            className="relative text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl"
          >
            Ready to run your business on Chasum?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Start free with the real product — CRM, calendar, reports, billing,
            and Emma — or book a demo with our team.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button
                size="lg"
                className="min-w-[180px] bg-white text-primary hover:bg-white/90"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={DEMO_HREF}>
              <Button
                size="lg"
                variant="outline"
                className="min-w-[180px] border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
              >
                Book Demo
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
