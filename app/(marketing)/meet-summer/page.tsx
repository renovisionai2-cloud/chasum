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
  MEET_SUMMER_HERO,
  MEET_SUMMER_INTERACTIVE,
  MEET_SUMMER_JOURNEY,
  MEET_SUMMER_MEMORY,
  MEET_SUMMER_OS,
  MEET_SUMMER_PROBLEM,
  MEET_SUMMER_THINKS,
} from "@/lib/marketing/meet-summer";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet Summer — AI Business Assistant",
  description:
    "Meet Summer, Chasum’s AI Business Assistant. Experience the future of the AI Business Operating System — then apply for Private Alpha.",
  openGraph: {
    title: "Meet Summer — Chasum’s AI Business Assistant",
    description:
      "A premium introduction to Summer — storytelling, live conversation, then Private Alpha.",
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
 * Premium Meet Summer launch experience (Phase 5) — presentation only.
 * Conversation still uses Knowledge Engine + Business Discovery.
 */
export default function MeetSummerPage() {
  return (
    <PageFade>
      <div className="meet-summer-premium">
        {/* 1. Cinematic hero */}
        <section className="relative isolate min-h-[min(92vh,54rem)] overflow-hidden px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="meet-summer-hero-atmosphere" aria-hidden />
          <div className="meet-summer-hero-orb meet-summer-hero-orb-a" aria-hidden />
          <div className="meet-summer-hero-orb meet-summer-hero-orb-b" aria-hidden />

          <div className="relative mx-auto max-w-4xl text-center">
            <Reveal>
              <p className="meet-summer-brand-mark">{MEET_SUMMER_HERO.brand}</p>
              <h1 className="meet-summer-display mt-6">{MEET_SUMMER_HERO.headline}</h1>
              <div className="mx-auto mt-10 max-w-2xl space-y-2">
                {MEET_SUMMER_HERO.lines.map((line, i) => (
                  <p
                    key={line}
                    className={
                      i === MEET_SUMMER_HERO.lines.length - 1
                        ? "text-lg font-medium leading-snug text-foreground md:text-xl"
                        : "text-lg text-muted-foreground md:text-xl"
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>
              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {MEET_SUMMER_HERO.lede}
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="#try-summer">
                  <Button
                    size="lg"
                    className="marketing-cta-button min-h-12 rounded-full px-8"
                  >
                    Experience Summer
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#private-alpha">
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-h-12 rounded-full border-border/70 bg-background/40 px-8 backdrop-blur-sm"
                  >
                    Continue to Private Alpha
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 2. The Problem */}
        <section
          id="problem"
          className="relative scroll-mt-24 px-6 py-24 md:py-36"
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

        {/* 3. How Summer Thinks */}
        <section
          id="how-summer-thinks"
          className="marketing-surface-tint relative scroll-mt-24 px-6 py-24 md:py-36"
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

        {/* 4. Business Memory */}
        <section
          id="business-memory"
          className="relative scroll-mt-24 px-6 py-24 md:py-36"
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

        {/* 5. AI Business Operating System */}
        <section
          id="operating-system"
          className="relative scroll-mt-24 overflow-hidden px-6 py-24 md:py-36"
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

        {/* 6. Interactive Summer — centerpiece */}
        <section
          id="try-summer"
          className="marketing-v3-dark relative scroll-mt-24 overflow-hidden px-6 py-24 md:py-36"
        >
          <div className="meet-summer-interactive-aura" aria-hidden />
          <div className="relative mx-auto max-w-3xl">
            <Reveal>
              <div className="text-center">
                <p className="marketing-eyebrow text-white/50">
                  {MEET_SUMMER_INTERACTIVE.eyebrow}
                </p>
                <h2 className="meet-summer-section-title text-white">
                  {MEET_SUMMER_INTERACTIVE.headline}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
                  {MEET_SUMMER_INTERACTIVE.body}
                </p>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className="mt-12">
                <SummerEmbeddedPanel />
              </div>
            </Reveal>
          </div>
        </section>

        {/* 7. Roadmap journey */}
        <section
          id="roadmap"
          className="marketing-surface-tint relative scroll-mt-24 px-6 py-24 md:py-36"
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

        {/* 8. Private Alpha — final chapter */}
        <section
          id="private-alpha"
          className="relative scroll-mt-24 border-t border-border/50 px-6 py-24 md:py-36"
        >
          <div className="mx-auto max-w-xl">
            <Reveal>
              <p className="marketing-eyebrow">Final chapter</p>
              <h2 className="meet-summer-section-title">
                Apply for Private Alpha
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                You have met Summer — who she is, how she thinks, and where she
                is going. If Chasum is a fit, apply as a design partner: limited
                seats, founder access, founding pricing.
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
