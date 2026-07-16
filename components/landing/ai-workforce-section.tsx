import { Spark } from "@/components/brand/spark";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { AI_EMPLOYEES_PREVIEW } from "@/lib/marketing/homepage";
import { ArrowRight, Bot, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";

export function AiWorkforceSection() {
  const [emma, ...comingSoon] = AI_EMPLOYEES_PREVIEW;

  return (
    <section
      id="ai-workforce"
      className="relative isolate scroll-mt-20 overflow-hidden px-6 py-24 md:py-36"
      aria-labelledby="ai-workforce-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.035] to-background" />
      <div className="marketing-orb marketing-orb-primary pointer-events-none absolute -right-28 top-20 -z-10 opacity-50" />
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Spark className="h-3.5 w-3.5" size={14} />
              AI Workforce vision
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">
                Emma available
              </span>
            </div>
            <h2
              id="ai-workforce-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              A team of AI employees — with jobs, not chatbots
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Emma is live in Phase 1. The broader workforce expands assist →
              automate with owner control, never inventing business data.
            </p>
          </div>
        </Reveal>

        {emma ? (
          <Reveal delayMs={80}>
            <article className="marketing-emma-card relative mt-12 overflow-hidden rounded-[var(--radius-lg)] border border-primary/25 bg-card p-6 shadow-xl shadow-primary/[0.08] md:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-spark text-3xl font-semibold text-white shadow-lg shadow-primary/20">
                      E
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-card bg-success" />
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {emma.availability}
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {emma.specialty}
                    </span>
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight">
                    {emma.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-primary">{emma.role}</p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {emma.summary}
                  </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/80 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Emma is handling reception</p>
                      <p className="text-xs text-muted-foreground">
                        Grounded in your live business settings
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      "Answers service and location questions",
                      "Checks real employee availability",
                      "Starts bookings and records CRM context",
                      "Escalates when a human should take over",
                    ].map((capability) => (
                      <div key={capability} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-muted-foreground">{capability}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup" className="mt-6 inline-block">
                    <Button className="marketing-cta-button">
                      Try Emma Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {comingSoon.map((employee, index) => (
            <Reveal key={employee.name} delayMs={(index % 3) * 60}>
              <article className="marketing-card-lift h-full rounded-[var(--radius-lg)] border border-border/70 bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Bot className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {employee.availability}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{employee.name}</h3>
                <p className="mt-0.5 text-xs font-medium text-primary">
                  {employee.role}
                </p>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {employee.specialty}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {employee.summary}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={100}>
          <div className="mt-10 flex justify-center">
            <p className="max-w-2xl text-center text-sm text-muted-foreground">
              One workforce, shared business context, and owner control at every
              step. New roles arrive only when they are ready to do useful work.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
