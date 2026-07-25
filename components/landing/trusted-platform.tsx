"use client";

import { Reveal } from "@/components/landing/reveal";

/**
 * Why Chasum exists — problem story. Words only. One idea.
 */
export function TrustedPlatform() {
  return (
    <section
      id="why-chasum"
      className="scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="why-chasum-heading"
    >
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2
            id="why-chasum-heading"
            className="text-balance text-center text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl md:leading-[1.15]"
          >
            Businesses don&apos;t need more software.
            <br />
            They need software that understands how the business works.
          </h2>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mx-auto mt-12 max-w-xl space-y-5 text-center text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
            <p>Appointments live in one system.</p>
            <p>Customers live in another.</p>
            <p>Payments somewhere else.</p>
            <p>Reports somewhere else again.</p>
            <p className="pt-2 text-foreground/80">
              Every day your team spends time connecting information that should
              already be connected.
            </p>
            <p className="pt-4 text-xl font-medium tracking-tight text-foreground md:text-2xl">
              Chasum changes that.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
