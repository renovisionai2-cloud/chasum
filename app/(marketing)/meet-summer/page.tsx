import { DesignPartnerForm } from "@/components/landing/design-partner-form";
import { PageFade } from "@/components/landing/page-fade";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { SummerWorkspace } from "@/components/website-concierge/summer-workspace";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  PRIVATE_ALPHA_HREF,
} from "@/lib/marketing/alpha";
import {
  MEET_SUMMER_FIRST_IMPRESSION,
  MEET_SUMMER_HERO,
  MEET_SUMMER_JOURNEY,
  MEET_SUMMER_MEMORY,
  MEET_SUMMER_OS,
  MEET_SUMMER_PROBLEM,
  MEET_SUMMER_THINKS,
} from "@/lib/marketing/meet-summer";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet Summer — AI Business Assistant",
  description:
    "Meet Summer, Chasum’s AI Business Assistant. A premium conversation experience that understands your business — then Private Alpha.",
  openGraph: {
    title: "Meet Summer — Chasum’s AI Business Assistant",
    description:
      "Talk with Summer in a premium AI workspace — live business understanding, then Private Alpha.",
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
 * Premium Conversation Experience (Phase 6) — presentation only.
 * Engines unchanged: Knowledge, Discovery, Session Memory, Provider Registry.
 */
export default function MeetSummerPage() {
  return (
    <PageFade>
      <div className="meet-summer-premium">
        {/* Hero — Summer is the focal point */}
        <section className="relative isolate overflow-hidden px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20">
          <div className="meet-summer-hero-atmosphere" aria-hidden />
          <div className="meet-summer-hero-orb meet-summer-hero-orb-a" aria-hidden />
          <div className="meet-summer-hero-orb meet-summer-hero-orb-b" aria-hidden />

          <div className="relative mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <p className="meet-summer-brand-mark">{MEET_SUMMER_HERO.brand}</p>
                <h1 className="meet-summer-display mt-5">{MEET_SUMMER_HERO.headline}</h1>
                <div className="mx-auto mt-8 max-w-xl space-y-1.5">
                  {MEET_SUMMER_HERO.lines.map((line, i) => (
                    <p
                      key={line}
                      className={
                        i === MEET_SUMMER_HERO.lines.length - 1
                          ? "text-base font-medium text-foreground md:text-lg"
                          : "text-base text-muted-foreground md:text-lg"
                      }
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                  {MEET_SUMMER_HERO.lede}
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={90}>
              <div className="mt-12 md:mt-14">
                <SummerWorkspace />
              </div>
            </Reveal>

            <Reveal delayMs={140}>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Prefer to keep reading first?{" "}
                <a
                  href="#problem"
                  className="font-medium text-primary hover:underline"
                >
                  Continue the story
                </a>
                {" · "}
                <a
                  href="#private-alpha"
                  className="font-medium text-primary hover:underline"
                >
                  Private Alpha
                  <ArrowRight className="ml-1 inline size-3.5" />
                </a>
              </p>
            </Reveal>
          </div>
        </section>

        {/* The Problem */}
        <section
          id="problem"
          className="relative scroll-mt-24 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="marketing-eyebrow">{MEET_SUMMER_PROBLEM.eyebrow}</p>
              <h2 className="meet-summer-section-title">
                {MEET_SUMMER_PROBLEM.headline}
              </h2>
              <p className="mt-5 text-2xl font-semibold tracking-tight text-primary md:text-3xl">
                {MEET_SUMMER_PROBLEM.accent}
              </p>
              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {MEET_SUMMER_PROBLEM.body}
              </p>
            </Reveal>
          </div>
        </section>

        {/* How Summer Thinks */}
        <section
          id="how-summer-thinks"
          className="marketing-surface-tint relative scroll-mt-24 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="marketing-eyebrow">{MEET_SUMMER_THINKS.eyebrow}</p>
                <h2 className="meet-summer-section-title">
                  {MEET_SUMMER_THINKS.headline}
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {MEET_SUMMER_THINKS.body}
                </p>
              </div>
            </Reveal>
            <ol className="meet-summer-think-chain mt-16">
              {MEET_SUMMER_THINKS.chain.map((node, i) => (
                <Reveal key={node.id} delayMs={i * 80}>
                  <li className="meet-summer-think-node">
                    <span className="meet-summer-think-index" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="meet-summer-think-label">{node.label}</span>
                    {i < MEET_SUMMER_THINKS.chain.length - 1 ? (
                      <span className="meet-summer-think-arrow" aria-hidden>
                        ↓
                      </span>
                    ) : null}
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Business Memory */}
        <section
          id="business-memory"
          className="relative scroll-mt-24 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="marketing-eyebrow">{MEET_SUMMER_MEMORY.eyebrow}</p>
                <h2 className="meet-summer-section-title">
                  {MEET_SUMMER_MEMORY.headline}
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {MEET_SUMMER_MEMORY.body}
                </p>
              </div>
            </Reveal>
            <ol className="meet-summer-memory-rail mt-16">
              {MEET_SUMMER_MEMORY.stages.map((stage, i) => (
                <Reveal key={stage.title} delayMs={i * 70}>
                  <li className="meet-summer-memory-step">
                    <div className="meet-summer-memory-marker" aria-hidden />
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-foreground">
                        {stage.title}
                      </h3>
                      <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
                        {stage.detail}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* OS Vision */}
        <section
          id="operating-system"
          className="relative scroll-mt-24 overflow-hidden px-6 py-24 md:py-32"
        >
          <div className="meet-summer-os-glow" aria-hidden />
          <div className="relative mx-auto max-w-4xl text-center">
            <Reveal>
              <p className="marketing-eyebrow">{MEET_SUMMER_OS.eyebrow}</p>
              <h2 className="meet-summer-section-title">{MEET_SUMMER_OS.headline}</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {MEET_SUMMER_OS.body}
              </p>
            </Reveal>
            <ul className="mt-14 flex flex-wrap justify-center gap-3">
              {MEET_SUMMER_OS.roles.map((role, i) => (
                <Reveal key={role} delayMs={(i % 4) * 40}>
                  <li className="meet-summer-role-chip">{role}</li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Roadmap */}
        <section
          id="roadmap"
          className="marketing-surface-tint relative scroll-mt-24 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="text-center">
                <p className="marketing-eyebrow">{MEET_SUMMER_JOURNEY.eyebrow}</p>
                <h2 className="meet-summer-section-title">
                  {MEET_SUMMER_JOURNEY.headline}
                </h2>
              </div>
            </Reveal>
            <ol className="meet-summer-journey mt-16">
              {MEET_SUMMER_JOURNEY.steps.map((step, i) => (
                <Reveal key={step.label} delayMs={i * 60}>
                  <li className="meet-summer-journey-step">
                    <div className="meet-summer-journey-rail" aria-hidden>
                      <span className="meet-summer-journey-dot" />
                      {i < MEET_SUMMER_JOURNEY.steps.length - 1 ? (
                        <span className="meet-summer-journey-line" />
                      ) : null}
                    </div>
                    <div className="pb-12 last:pb-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        {step.label}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Premium AI First Impression */}
        <section
          id="first-impression"
          className="relative scroll-mt-24 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <p className="marketing-eyebrow">
                {MEET_SUMMER_FIRST_IMPRESSION.eyebrow}
              </p>
              <h2 className="meet-summer-section-title">
                {MEET_SUMMER_FIRST_IMPRESSION.headline}
              </h2>
            </Reveal>
            <ul className="mt-12 space-y-5">
              {MEET_SUMMER_FIRST_IMPRESSION.points.map((point, i) => (
                <Reveal key={point} delayMs={i * 55}>
                  <li className="meet-summer-impression-line">
                    <span className="meet-summer-impression-index" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-lg font-medium tracking-tight text-foreground md:text-xl">
                      {point}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>
            <Reveal delayMs={200}>
              <div className="mt-12 text-center">
                <a href="#try-summer">
                  <Button
                    size="lg"
                    className="marketing-cta-button rounded-full px-8"
                  >
                    Return to Summer
                  </Button>
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Private Alpha */}
        <section
          id="private-alpha"
          className="relative scroll-mt-24 border-t border-border/50 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-xl">
            <Reveal>
              <p className="marketing-eyebrow">Final chapter</p>
              <h2 className="meet-summer-section-title">
                Apply for Private Alpha
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                You have met Summer — intelligent, curious, and grounded in your
                business. If Chasum is a fit, apply as a design partner.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
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
              <div className="meet-summer-apply-shell mt-12 p-6 sm:p-8">
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
      </div>
    </PageFade>
  );
}
