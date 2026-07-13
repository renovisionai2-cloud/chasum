import { SparkMark } from "@/components/brand/marks";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-primary px-8 py-16 text-center shadow-lg md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-primary-foreground">
            <SparkMark className="h-6 w-6" />
          </div>
          <h2 className="relative text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Ready to run your business on Chasum?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Scheduling, clients, locations, and AI automation — one premium
            platform for service businesses.
          </p>
          <Link href="/signup" className="relative mt-8 inline-block">
            <Button
              size="lg"
              className="min-w-[200px] bg-white text-primary hover:bg-white/90"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
