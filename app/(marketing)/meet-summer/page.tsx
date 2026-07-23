import { DesignPartnerForm } from "@/components/landing/design-partner-form";
import { PageFade } from "@/components/landing/page-fade";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { SummerEmbeddedPanel } from "@/components/website-concierge/summer-embedded-panel";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  PRIVATE_ALPHA_HREF,
} from "@/lib/marketing/alpha";
import {
  MEET_SUMMER_INSIDE,
  MEET_SUMMER_NEED,
  MEET_SUMMER_ROADMAP,
  MEET_SUMMER_STORY,
  MEET_SUMMER_TODAY,
} from "@/lib/marketing/meet-summer";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet Summer — AI Business Assistant",
  description:
    "Meet Summer, Chasum’s AI Business Assistant. Learn who she is, try the concierge, then apply for Private Alpha.",
  openGraph: {
    title: "Meet Summer — Chasum’s AI Business Assistant",
    description:
      "An introduction to Summer before Private Alpha — story, capabilities, and a live conversation.",
    images: [
      {
        url: BRAND_ASSETS.ogImage,
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — Meet Summer`,
      },
    ],
  },
};

/**
 * Flagship Meet Summer experience — story first, apply last.
 */
export default function MeetSummerPage() {
  return (
    <PageFade>
      {/* 1. Hero */}
      <section className="marketing-section-contain relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_55%)]"
          aria-hidden
        />
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="marketing-eyebrow inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Flagship AI
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Meet Summer
            </h1>
            <p className="mt-4 text-xl font-medium text-primary md:text-2xl">
              Your AI Business Assistant
            </p>
            <p className="marketing-lede mx-auto mt-6 max-w-2xl">
              Summer is the intelligence layer of Chasum — not simply an AI
              receptionist. She introduces the product, guides your questions,
              and points toward the operating system your business will run on.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#try-summer">
                <Button size="lg" className="marketing-cta-button min-h-12 rounded-full px-8">
                  Try Summer
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </a>
              <a href="#private-alpha">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 rounded-full px-8"
                >
                  Continue to Private Alpha
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story beat */}
      <section className="marketing-section-contain border-t border-border/60 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="marketing-eyebrow">The introduction</p>
            <h2 className="marketing-h2 max-w-2xl">
              A flagship product — told as a story, not a feature list
            </h2>
            <p className="marketing-lede mt-4 max-w-2xl">
              By the time you reach Private Alpha, you should know who Summer is,
              why she exists, how she helps, and why she is not a traditional
              chatbot.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {MEET_SUMMER_STORY.map((item, i) => (
              <Reveal key={item.title} delayMs={i * 60}>
                <article className="h-full rounded-2xl border border-border/70 bg-card/50 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2. What Summer can do today */}
      <section className="marketing-section-contain marketing-surface-tint px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="marketing-eyebrow">Today</p>
            <h2 className="marketing-h2">What Summer can do today</h2>
            <p className="marketing-lede mt-4 max-w-2xl">
              On the public site, Summer is already useful — grounded in the
              Knowledge Engine, not inventing answers.
            </p>
          </Reveal>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEET_SUMMER_TODAY.map((item, i) => (
              <Reveal key={item.title} delayMs={(i % 3) * 50}>
                <li className="h-full rounded-2xl border border-border/60 bg-background/80 p-5">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Inside Chasum */}
      <section className="marketing-section-contain px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="marketing-eyebrow">Inside Chasum</p>
            <h2 className="marketing-h2 max-w-2xl">
              What Summer will do inside the AI Business Operating System
            </h2>
            <p className="marketing-lede mt-4 max-w-2xl">
              One Business Brain. Role-specific assistants. The long-term vision
              from Chasum’s blueprint — reception through executive advice.
            </p>
          </Reveal>
          <ul className="mt-12 grid gap-3 sm:grid-cols-2">
            {MEET_SUMMER_INSIDE.map((item, i) => (
              <Reveal key={item.title} delayMs={(i % 2) * 40}>
                <li className="flex gap-4 rounded-2xl border border-border/60 bg-card/40 px-5 py-4">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Interactive Summer */}
      <section
        id="try-summer"
        className="marketing-section-contain marketing-v3-dark scroll-mt-24 px-6 py-20 md:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="marketing-eyebrow text-white/50">Live conversation</p>
            <h2 className="marketing-h2 text-white">Talk with Summer</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65">
              Same Knowledge Engine as the site-wide concierge. Ask about
              industries, pricing, reception, or how Chasum is different — then
              continue when you are ready.
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="mt-10">
              <SummerEmbeddedPanel />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. Why businesses need Summer */}
      <section className="marketing-section-contain px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="marketing-eyebrow">The problem</p>
            <h2 className="marketing-h2 max-w-2xl">
              Traditional software stores information. Summer understands it.
            </h2>
            <p className="marketing-lede mt-4 max-w-2xl">
              Calendars and CRMs keep rows. Summer is built to turn those rows
              into judgment — what to do next for this business.
            </p>
          </Reveal>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEET_SUMMER_NEED.map((item, i) => (
              <Reveal key={item.title} delayMs={(i % 3) * 50}>
                <li className="h-full rounded-2xl border border-border/70 bg-card/50 p-5">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Roadmap */}
      <section className="marketing-section-contain marketing-surface-tint px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="marketing-eyebrow">Roadmap</p>
            <h2 className="marketing-h2">How Summer evolves</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {MEET_SUMMER_ROADMAP.map((col, i) => (
              <Reveal key={col.phase} delayMs={i * 70}>
                <article className="h-full rounded-2xl border border-border/70 bg-background/90 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {col.phase}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {col.items.map((item) => (
                      <li
                        key={item}
                        className="border-l-2 border-primary/30 pl-3 text-sm font-medium text-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Private Alpha */}
      <section
        id="private-alpha"
        className="marketing-section-contain scroll-mt-24 border-t border-border/70 px-6 py-20 md:py-28"
      >
        <div className="mx-auto max-w-xl">
          <Reveal>
            <p className="marketing-eyebrow">Next step</p>
            <h2 className="marketing-h2">Apply for Private Alpha</h2>
            <p className="marketing-lede mt-4">
              You have met Summer. If Chasum is a fit, apply as a design partner —
              limited seats, founder access, founding pricing.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Prefer context on the program?{" "}
              <Link
                href={PRIVATE_ALPHA_HREF}
                className="text-primary hover:underline"
              >
                Why Private Alpha?
              </Link>
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="mt-10 rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8">
              <DesignPartnerForm />
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Or go directly to{" "}
              <Link href={APPLY_HREF} className="text-primary hover:underline">
                {CTA_APPLY_LABEL}
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </PageFade>
  );
}
