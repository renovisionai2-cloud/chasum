import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  DEMO_HREF,
} from "@/lib/marketing/alpha";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** Calm Private Alpha closing — Front Door. */
export function PrivateAlphaInvite() {
  return (
    <section
      id="private-alpha"
      className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="alpha-invite-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">Private Alpha</p>
            <h2 id="alpha-invite-heading" className="marketing-h2-xl">
              Help shape the future of business intelligence.
            </h2>
            <p className="marketing-lede">
              We&apos;re growing Chasum with a limited number of service
              businesses before opening public access. Design partners receive
              direct support, guided onboarding and a meaningful voice in what we
              improve next.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href={APPLY_HREF}>
              <Button size="lg" className="h-12 min-h-11 rounded-full px-8">
                {CTA_APPLY_LABEL}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={DEMO_HREF}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 min-h-11 rounded-full px-8"
              >
                {CTA_DEMO_LABEL}
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
