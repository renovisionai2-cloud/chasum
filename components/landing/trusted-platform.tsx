"use client";

import { Reveal } from "@/components/landing/reveal";
import { HOW_IT_WORKS_HREF } from "@/lib/marketing/alpha";
import Link from "next/link";

const OUTCOMES = [
  {
    title: "Run the day",
    body: "Scheduling, reception, customers, employees and communication stay connected.",
  },
  {
    title: "Understand what changed",
    body: "Payments, activity and reports reflect the same operational record.",
  },
  {
    title: "Grow with intelligence",
    body: "Summer helps people find answers, navigate workflows and make better-informed decisions.",
  },
] as const;

/**
 * Why Chasum — replaces zero-counter / empty stats presentation.
 */
export function TrustedPlatform() {
  return (
    <section
      id="why-chasum"
      className="scroll-mt-24 px-6 py-20 md:py-28"
      aria-labelledby="why-chasum-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="marketing-eyebrow">Why Chasum</p>
          <h2 id="why-chasum-heading" className="marketing-h2-xl max-w-3xl">
            Your business does not need more disconnected software.
          </h2>
          <div className="mt-6 max-w-2xl space-y-3 text-lg leading-relaxed text-muted-foreground">
            <p>Calendars hold appointments.</p>
            <p>CRMs hold customer records.</p>
            <p>Payment tools hold transactions.</p>
            <p>Reports hold numbers.</p>
            <p className="font-medium text-foreground">
              Chasum connects the work—so your team can run the day from one
              place and understand what needs attention next.
            </p>
          </div>
        </Reveal>

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {OUTCOMES.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 60}>
              <li className="h-full rounded-2xl border border-border/70 bg-card/60 p-6 md:p-7">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delayMs={180}>
          <div className="mt-10">
            <Link
              href={HOW_IT_WORKS_HREF}
              className="marketing-focus-ring text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              See how Chasum works
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
