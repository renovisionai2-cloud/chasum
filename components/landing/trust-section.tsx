"use client";

import { Reveal } from "@/components/landing/reveal";
import { APPLY_HREF, PRIVATE_ALPHA_HREF } from "@/lib/marketing/alpha";
import Link from "next/link";

const POINTS = [
  {
    title: "Real business validation",
    body: "Workflows are tested with operating service businesses.",
  },
  {
    title: "Founder access",
    body: "Design partners speak directly with the product team.",
  },
  {
    title: "Honest product status",
    body: "Available Today, Early Access, Coming Next and Future Vision are labelled clearly.",
  },
  {
    title: "No fictional proof",
    body: "We do not publish invented testimonials, logos, customer counts or performance statistics.",
  },
] as const;

export function TrustSection() {
  return (
    <section
      id="trust"
      className="scroll-mt-24 px-6 py-20 md:py-28"
      aria-labelledby="trust-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="marketing-eyebrow">Built in the real world</p>
          <h2 id="trust-heading" className="marketing-h2-xl max-w-3xl">
            Designed with operators, not assumptions.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Chasum is being developed alongside service businesses that use
            scheduling, customer management, payments and reporting every day.
            Private Alpha gives design partners direct access to the people
            building the product—and gives us the responsibility to earn every
            public claim.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {POINTS.map((point, index) => (
            <Reveal key={point.title} delayMs={index * 40}>
              <li className="rounded-2xl border border-border/70 bg-card/50 p-5">
                <h3 className="font-semibold text-foreground">{point.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delayMs={160}>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={PRIVATE_ALPHA_HREF}
              className="marketing-focus-ring text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Why Private Alpha?
            </Link>
            <Link
              href={APPLY_HREF}
              className="marketing-focus-ring text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Apply for Private Alpha
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
