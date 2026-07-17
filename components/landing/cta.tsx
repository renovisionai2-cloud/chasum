import { SparkMark } from "@/components/brand/marks";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { DEMO_HREF } from "@/lib/marketing/homepage";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section
      className="marketing-v3-dark relative overflow-hidden px-6 py-28 md:py-40"
      aria-labelledby="final-cta-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-spark/15 blur-[80px]" />
      </div>

      <Reveal>
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary">
            <SparkMark className="h-7 w-7" />
          </div>
          <h2
            id="final-cta-heading"
            className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-6xl md:leading-[1.05]"
          >
            Your Business Deserves an Operating System.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/60 md:text-xl">
            Start free with the real product — CRM, calendar, reports, billing,
            and Emma — or book a demo with our team.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button
                size="lg"
                className="marketing-cta-button min-w-[200px] rounded-full shadow-md shadow-primary/30"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={DEMO_HREF}>
              <Button
                variant="outline"
                size="lg"
                className="marketing-cta-button min-w-[200px] rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Book Demo
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-white/45">
            No credit card required · Cancel anytime
          </p>
        </div>
      </Reveal>
    </section>
  );
}
