"use client";

import { Reveal } from "@/components/landing/reveal";
import {
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
  ROADMAP_HREF,
} from "@/lib/marketing/alpha";
import Link from "next/link";

const CAPABILITIES = [
  {
    title: "Website concierge",
    body: "Helps visitors understand Chasum and discover the right workflows.",
  },
  {
    title: "Product guide",
    body: "Explains features, industries and Private Alpha access.",
  },
  {
    title: "Reception and booking assistance",
    status: "Early Access",
    body: "Uses configured business information and real availability where the implementation supports it.",
  },
] as const;

/**
 * Summer introduction — placed early on the homepage.
 */
export function SummerIntro() {
  return (
    <section
      id="meet-the-intelligence"
      className="scroll-mt-24 px-6 py-20 md:py-28"
      aria-labelledby="summer-intro-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="marketing-eyebrow">Meet the intelligence</p>
          <h2 id="summer-intro-heading" className="marketing-h2-xl max-w-3xl">
            Summer understands the question behind the question.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Summer is Chasum’s AI Business Assistant. On the public website, she
            helps visitors explore the product. Inside Chasum, her Early Access
            role is grounded in the business’s configured services, hours,
            employees and locations—so she can assist without inventing answers.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {CAPABILITIES.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 50}>
              <li className="h-full rounded-2xl border border-border/70 bg-card/60 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {"status" in item && item.status ? (
                    <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {item.status}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delayMs={160}>
          <p className="mt-8 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Future direction: </span>
            Business understanding and recommendations · Future Vision
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={MEET_SUMMER_HREF}
              className="marketing-focus-ring inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
            >
              {CTA_MEET_SUMMER_LABEL}
            </Link>
            <Link
              href={ROADMAP_HREF}
              className="marketing-focus-ring inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-foreground"
            >
              View the AI roadmap
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
