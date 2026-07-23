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
  MEET_SUMMER_INTELLIGENCE,
  MEET_SUMMER_JOURNEY,
  MEET_SUMMER_MANIFESTO,
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
  title: "Meet Summer — Intelligence behind Chasum",
  description:
    "Meet Summer, the intelligence layer of Chasum’s AI Business Operating System — not a chatbot, not support, not simply reception.",
  openGraph: {
    title: "Meet Summer — The intelligence behind Chasum",
    description:
      "Chasum’s flagship AI experience. Talk with Summer in an intelligence console that understands your business.",
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
 * Flagship Meet Summer experience — emotional centerpiece of marketing.
 * Engines unchanged: Knowledge, Discovery, Session Memory, Provider Registry.
 */
export default function MeetSummerPage() {
  return (
    <PageFade>
      <div className="meet-summer-premium meet-summer-flagship">
        {/* Flagship stage — brand + intelligence console */}
        <section className="meet-summer-stage relative isolate overflow-hidden px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24">
          <div className="meet-summer-stage-glow" aria-hidden />
          <div className="meet-summer-hero-orb meet-summer-hero-orb-a" aria-hidden />
          <div className="meet-summer-hero-orb meet-summer-hero-orb-b" aria-hidden />

          <div className="relative mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/90">
                  Flagship AI experience
                </p>
                <p className="meet-summer-brand-mark mt-5 text-white">
                  {MEET_SUMMER_HERO.brand}
                </p>
                <h1 className="mt-6 text-[clamp(1.75rem,4vw,2.85rem)] font-semibold tracking-[-0.035em] text-white/90">
                  {MEET_SUMMER_HERO.headline}
                </h1>
                <ul className="mx-auto mt-8 flex max-w-lg flex-col gap-2 text-base text-white/55 md:text-lg">
                  {MEET_SUMMER_HERO.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
                  {MEET_SUMMER_HERO.lede}
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={100}>
              <div className="mt-12 md:mt-14">
                <SummerWorkspace />
              </div>
            </Reveal>

            <Reveal delayMs={160}>
              <p className="mt-10 text-center text-sm text-white/45">
                Keep exploring the story{" "}
                <a href="#manifesto" className="text-white/80 hover:underline">
                  below
                </a>
                {" · "}
                <a
                  href="#private-alpha"
                  className="inline-flex items-center text-white/80 hover:underline"
                >
                  Private Alpha
                  <ArrowRight className="ml-1 size-3.5" />
                </a>
              </p>
            </Reveal>
          </div>
        </section>

        {/* Manifesto — success criteria */}
        <section
          id="manifesto"
          className="relative scroll-mt-24 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="marketing-eyebrow">{MEET_SUMMER_MANIFESTO.eyebrow}</p>
                <h2 className="meet-summer-section-title">
                  {MEET_SUMMER_MANIFESTO.headline}
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {MEET_SUMMER_MANIFESTO.body}
                </p>
              </div>
            </Reveal>
            <ul className="mt-16 grid gap-8 sm:grid-cols-2">
              {MEET_SUMMER_MANIFESTO.pillars.map((pillar, i) => (
                <Reveal key={pillar.title} delayMs={(i % 2) * 60}>
                  <li className="meet-summer-pillar">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {pillar.detail}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Intelligence posture */}
        <section
          id="intelligence"
          className="marketing-v3-dark relative scroll-mt-24 overflow-hidden px-6 py-24 md:py-32"
        >
          <div className="meet-summer-interactive-aura" aria-hidden />
          <div className="relative mx-auto max-w-4xl text-center">
            <Reveal>
              <p className="marketing-eyebrow text-white/50">
                {MEET_SUMMER_INTELLIGENCE.eyebrow}
              </p>
              <h2 className="meet-summer-section-title text-white">
                {MEET_SUMMER_INTELLIGENCE.headline}
              </h2>
            </Reveal>
            <ul className="mt-14 flex flex-wrap justify-center gap-3">
              {MEET_SUMMER_INTELLIGENCE.cues.map((cue, i) => (
                <Reveal key={cue.id} delayMs={(i % 3) * 50}>
                  <li className="meet-summer-intel-cue">{cue.label}</li>
                </Reveal>
              ))}
            </ul>
            <Reveal delayMs={120}>
              <p className="mx-auto mt-12 max-w-lg text-sm leading-relaxed text-white/55">
                The interface should communicate intelligence visually — not by
                pretending Summer is human, and not by looking like live chat.
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
            <Reveal delayMs={120}>
              <p className="mx-auto mt-12 max-w-xl text-sm font-medium tracking-wide text-primary/90">
                Chasum is not another scheduling platform. It is the AI Business
                Operating System.
              </p>
            </Reveal>
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

        {/* Emotional close */}
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
                You have met the intelligence behind Chasum. If this is the
                future you want to build with, apply as a design partner.
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
