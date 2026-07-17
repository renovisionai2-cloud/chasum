import { Spark } from "@/components/brand/spark";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { AI_EMPLOYEES_PREVIEW } from "@/lib/marketing/homepage";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";

/**
 * V3 AI Workforce — Emma is the star employee; the team feels exciting.
 */
export function AiWorkforceSection() {
  const [emma, ...comingSoon] = AI_EMPLOYEES_PREVIEW;

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
              AI Workforce
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-success">
                Emma available
              </span>
            </div>
            <h2 id="ai-workforce-heading" className="marketing-h2-xl">
              A Team of AI Employees — with Jobs, Not Chatbots
            </h2>
            <p className="marketing-lede">
              Emma is live in Phase 1. The broader workforce expands assist →
              automate with owner control, never inventing business data.
            </p>
          </div>
        </Reveal>

        {emma ? (
          <Reveal delayMs={80}>
            <div className="mt-16 grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
              <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm md:p-10">
                <div className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-primary to-spark text-3xl font-semibold text-white shadow-lg shadow-primary/30">
                      E
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#0b1324] bg-success" />
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {emma.availability}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                        {emma.specialty}
                      </span>
                    </div>
                    <h3 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                      {emma.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {emma.role}
                    </p>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-white/65">
                      {emma.summary}
                    </p>
                  </div>
                </div>

                <ul className="mt-8 space-y-3 border-t border-white/10 pt-8">
                  {[
                    "Answers service and location questions",
                    "Checks real employee availability",
                    "Starts bookings and records CRM context",
                    "Escalates when a human should take over",
                  ].map((capability) => (
                    <li key={capability} className="flex items-center gap-3 text-sm text-white/70">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      {capability}
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="mt-8 inline-block">
                  <Button className="marketing-cta-button rounded-full px-7">
                    Try Emma Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </article>

              <div className="marketing-product-frame">
                <DashboardPreview
                  variant="emma"
                  live
                  animated
                  className="min-h-[360px] border-0 shadow-none md:min-h-[480px]"
                />
              </div>
            </div>
          </Reveal>
        ) : null}

        <div className="mt-12">
          <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Joining the Team
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {comingSoon.map((employee, index) => (
              <Reveal key={employee.name} delayMs={(index % 3) * 50}>
                <article className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                      {employee.name.slice(0, 1)}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-white/50">
                      <Clock3 className="h-3 w-3" />
                      Soon
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {employee.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-primary">
                    {employee.role}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    {employee.summary}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
