import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_EARLY_ACCESS_LABEL,
  PRIVATE_ALPHA_HREF,
  ROADMAP_HREF,
} from "@/lib/marketing/alpha";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** Replaces placeholder customer stories during Private Alpha. */
export function PrivateAlphaInvite() {
  return (
    <section
      id="stories"
      className="marketing-section-contain scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="alpha-invite-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">Private Alpha</p>
            <h2 id="alpha-invite-heading" className="marketing-h2-xl">
              Building with a limited set of operators
            </h2>
            <p className="marketing-lede">
              We are not publishing fictional logos or case studies. Design
              partners get founder access, roadmap influence, and early access to
              Summer and Chase — then we earn public proof together.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href={APPLY_HREF}>
              <Button size="lg" className="rounded-full px-8">
                {CTA_APPLY_LABEL}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={PRIVATE_ALPHA_HREF}>
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Why Private Alpha?
              </Button>
            </Link>
            <Link href={ROADMAP_HREF}>
              <Button variant="ghost" size="lg" className="rounded-full px-6">
                {CTA_EARLY_ACCESS_LABEL === "Request Early Access"
                  ? "View roadmap"
                  : "View roadmap"}
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
