import { Spark } from "@/components/brand/spark";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { AI_EMPLOYEES_PREVIEW } from "@/lib/marketing/homepage";
import Link from "next/link";

export function AiWorkforceSection() {
  return (
    <section
      id="ai-workforce"
      className="scroll-mt-20 px-6 py-20 md:py-28"
      aria-labelledby="ai-workforce-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Spark className="h-3.5 w-3.5" size={14} />
              AI Workforce vision
              <span className="rounded-full bg-spark-muted px-2 py-0.5 text-spark">
                Coming Soon
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_EMPLOYEES_PREVIEW.map((employee, index) => (
            <Reveal key={employee.name} delayMs={(index % 3) * 60}>
              <article className="marketing-card-lift rounded-[var(--radius-md)] border border-border/70 bg-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{employee.name}</h3>
                  <span
                    className={
                      employee.status.includes("live")
                        ? "text-xs font-medium text-success"
                        : "text-xs font-medium text-spark"
                    }
                  >
                    {employee.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{employee.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {employee.summary}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={100}>
          <div className="mt-10 flex justify-center">
            <Link href="/signup">
              <Button variant="outline">Try Emma on the Free plan</Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
