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
export function PrivateAlphaInvite({
  headline = "Help shape the future of business intelligence.",
}: {
  headline?: string;
}) {
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
              {headline}
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
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-stretch gap-3 sm:mt-12 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
            <Link href={APPLY_HREF} className="inline-flex justify-center">
              <Button
                size="lg"
                className="marketing-cta-button h-12 min-h-12 w-full rounded-full px-8 text-[15px] leading-none sm:w-auto"
              >
                {CTA_APPLY_LABEL}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Button>
            </Link>
            <Link href={DEMO_HREF} className="inline-flex justify-center">
              <Button
                variant="outline"
                size="lg"
                className="marketing-cta-button h-12 min-h-12 w-full rounded-full px-8 text-[15px] leading-none sm:w-auto"
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
