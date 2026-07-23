import { DesignPartnerForm } from "@/components/landing/design-partner-form";
import { PageFade } from "@/components/landing/page-fade";
import { Reveal } from "@/components/landing/reveal";
import { SummerWorkspace } from "@/components/website-concierge/summer-workspace";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  PRIVATE_ALPHA_HREF,
} from "@/lib/marketing/alpha";
import {
  MEET_SUMMER_CH1,
  MEET_SUMMER_CH7,
  MEET_SUMMER_CH8,
  MEET_SUMMER_EXPERIENCE,
} from "@/lib/marketing/meet-summer";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meet Summer — The Intelligence Behind Every Business Decision",
  description:
    "Meet Summer, Chasum’s AI Business Assistant. A flagship story: discovery, visible intelligence, personalized recommendations, then Private Alpha.",
  openGraph: {
    title: "Meet Summer — The Intelligence Behind Every Business Decision",
    description:
      "Chasum’s flagship AI experience. Not a chatbot — the intelligence layer of an AI Business Operating System.",
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
 * Complete Meet Summer rebuild — story chapters from first principles.
 * Reuses Discovery, Knowledge, Session Memory, Provider Registry only.
 */
export default function MeetSummerPage() {
  return (
    <PageFade>
      <article className="msx">
        {/* Chapter 1 — Meet Summer */}
        <section className="msx-ch1" aria-labelledby="msx-ch1-title">
          <div className="msx-ch1-atmosphere" aria-hidden />
          <div className="msx-ch1-inner">
            <Reveal>
              <p className="msx-chapter-label">Chapter 01</p>
              <p id="msx-ch1-title" className="msx-ch1-brand">
                {MEET_SUMMER_CH1.brand}
              </p>
              <h1 className="msx-ch1-headline">{MEET_SUMMER_CH1.headline}</h1>
              <p className="msx-ch1-aside">{MEET_SUMMER_CH1.aside}</p>
            </Reveal>
            <Reveal delayMs={120}>
              <a href="#experience" className="msx-ch1-continue">
                Continue
                <span aria-hidden>↓</span>
              </a>
            </Reveal>
          </div>
        </section>

        {/* Chapters 2–6 — Experience */}
        <section
          className="msx-ch-experience"
          aria-labelledby="msx-experience-heading"
        >
          <div className="msx-ch-experience-intro">
            <Reveal>
              <p className="msx-chapter-label text-white/45">
                {MEET_SUMMER_EXPERIENCE.eyebrow}
              </p>
              <h2
                id="msx-experience-heading"
                className="msx-section-title text-white"
              >
                {MEET_SUMMER_EXPERIENCE.title}
              </h2>
              <p className="msx-section-lede text-white/55">
                {MEET_SUMMER_EXPERIENCE.lede}
              </p>
            </Reveal>
          </div>
          <Reveal delayMs={80}>
            <SummerWorkspace />
          </Reveal>
        </section>

        {/* Chapter 7 — AI Business Operating System */}
        <section
          id="operating-system"
          className="msx-ch7 scroll-mt-24"
          aria-labelledby="msx-ch7-title"
        >
          <div className="msx-ch7-inner">
            <Reveal>
              <p className="msx-chapter-label">{MEET_SUMMER_CH7.eyebrow}</p>
              <h2 id="msx-ch7-title" className="msx-section-title">
                {MEET_SUMMER_CH7.title}
              </h2>
              <p className="msx-section-lede">{MEET_SUMMER_CH7.lede}</p>
            </Reveal>

            <ol className="msx-roadmap">
              {MEET_SUMMER_CH7.phases.map((col, i) => (
                <Reveal key={col.phase} delayMs={i * 80}>
                  <li className="msx-roadmap-phase">
                    <p className="msx-roadmap-phase-label">{col.phase}</p>
                    <ul className="msx-roadmap-items">
                      {col.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    {i < MEET_SUMMER_CH7.phases.length - 1 ? (
                      <span className="msx-roadmap-arrow" aria-hidden>
                        ↓
                      </span>
                    ) : null}
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Chapter 8 — Private Alpha */}
        <section
          id="private-alpha"
          className="msx-ch8 scroll-mt-24"
          aria-labelledby="msx-ch8-title"
        >
          <div className="msx-ch8-inner">
            <Reveal>
              <p className="msx-chapter-label">{MEET_SUMMER_CH8.eyebrow}</p>
              <h2 id="msx-ch8-title" className="msx-section-title">
                {MEET_SUMMER_CH8.title}
              </h2>
              <p className="msx-section-lede">{MEET_SUMMER_CH8.lede}</p>
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
            <Reveal delayMs={90}>
              <div className="msx-apply mt-12">
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
      </article>
    </PageFade>
  );
}
