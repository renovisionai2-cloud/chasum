import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Ready to simplify scheduling?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Join thousands of businesses who trust Chasum to manage their
            appointments. Start free today.
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
