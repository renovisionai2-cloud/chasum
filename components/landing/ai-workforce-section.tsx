import { Spark } from "@/components/brand/spark";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
  ROADMAP_HREF,
} from "@/lib/marketing/alpha";
import { AI_EMPLOYEES_PREVIEW } from "@/lib/marketing/homepage";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";

/**
 * AI assistance — Early Access roles visually separated from Coming Next / Future Vision.
 */
export function AiWorkforceSection() {
  const earlyAccess = AI_EMPLOYEES_PREVIEW.filter(
    (e) => e.status === "Early Access",
  );
  const comingNext = AI_EMPLOYEES_PREVIEW.filter(
    (e) => e.status === "Coming Next",
  );
  const futureVision = AI_EMPLOYEES_PREVIEW.filter(
    (e) => e.status === "Future Vision",
  );
  const summer = earlyAccess.find((e) => e.name === "Summer");
  const chase = earlyAccess.find((e) => e.name === "Chase");

  return (
    <section
      id="ai-workforce"
      className="marketing-section-contain marketing-v3-dark relative isolate scroll-mt-24 overflow-hidden px-6 py-24 md:py-36"
      aria-labelledby="ai-workforce-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70">
              <Spark className="h-3.5 w-3.5" size={14} />
              AI Assistance
              <span className="rounded-full bg-primary/25 px-2 py-0.5 text-primary">
                Early Access
              </span>
            </div>
            <h2 id="ai-workforce-heading" className="marketing-h2-xl">
              AI assistance with clear roles—not a collection of chatbots.
            </h2>
            <p className="marketing-lede">
              Summer and Chase are in Early Access for design partners.
              Additional roles are Coming Next or Future Vision — labelled
              honestly, never presented as shipping today.
            </p>
          </div>
        </Reveal>

        {summer ? (
          <Reveal delayMs={80}>
            <div className="mt-16 grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
              <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm md:p-10">
                <div className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-primary to-spark text-3xl font-semibold text-white shadow-lg shadow-primary/30">
                      S
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#0b1324] bg-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {summer.availability}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                        {summer.specialty}
                      </span>
                    </div>
                    <h3 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                      {summer.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {summer.role}
                    </p>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-white/65">
                      {summer.summary}
                    </p>
                    {chase ? (
                      <p className="mt-4 text-sm text-white/55">
                        Also in Early Access:{" "}
                        <strong className="text-white/80">{chase.name}</strong>{" "}
                        — {chase.role}. {chase.summary}
                      </p>
                    ) : null}
                  </div>
                </div>

                <ul className="mt-8 space-y-3 border-t border-white/10 pt-8">
                  {[
                    "Website concierge and product guide",
                    "Grounded business questions where configured",
                    "Real availability — never invented times",
                    "Escalates when a human should take over",
                  ].map((capability) => (
                    <li
                      key={capability}
                      className="flex items-center gap-3 text-sm text-white/70"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {capability}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href={MEET_SUMMER_HREF} className="inline-block">
                    <Button className="marketing-cta-button rounded-full px-7">
                      {CTA_MEET_SUMMER_LABEL}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    href={APPLY_HREF}
                    className="text-sm font-medium text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    {CTA_APPLY_LABEL}
                  </Link>
                </div>
              </article>

              <div className="marketing-product-frame">
                <DashboardPreview
                  variant="summer"
                  live
                  animated
                  className="min-h-[360px] border-0 shadow-none md:min-h-[480px]"
                />
              </div>
            </div>
          </Reveal>
        ) : null}

        {comingNext.length > 0 ? (
          <div className="mt-14">
            <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
              Coming Next
            </p>
            <div className="mx-auto grid max-w-xl gap-3">
              {comingNext.map((employee, index) => (
                <Reveal key={employee.name} delayMs={index * 40}>
                  <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {employee.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-white/50">
                          {employee.role}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[10px] font-medium text-primary">
                        <Clock3 className="h-3 w-3" />
                        {employee.availability}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-white/45">
                      {employee.summary}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}

        {futureVision.length > 0 ? (
          <div className="mt-12">
            <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
              Future Vision
            </p>
            <div className="grid gap-3 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
              {futureVision.map((employee, index) => (
                <Reveal key={employee.name} delayMs={(index % 3) * 50}>
                  <article className="h-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white/70">
                        {employee.name.slice(0, 1)}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-white/45">
                        <Clock3 className="h-3 w-3" />
                        {employee.availability}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white/85">
                      {employee.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-white/45">
                      {employee.role}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-white/40">
                      {employee.summary}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-white/40">
              <Link
                href={ROADMAP_HREF}
                className="underline-offset-4 hover:text-white/70 hover:underline"
              >
                View the public roadmap
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
