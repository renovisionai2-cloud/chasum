import { Reveal } from "@/components/landing/reveal";
import { TESTIMONIALS } from "@/lib/marketing/homepage";

export function Testimonials() {
  return (
    <section
      id="stories"
      className="scroll-mt-20 px-6 py-24 md:py-36"
      aria-labelledby="stories-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Customer stories
            </p>
            <h2
              id="stories-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Results operators can feel
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Illustrative early-partner stories — real photos and verified case
              studies will replace these placeholders at launch.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((item, index) => (
            <Reveal key={item.company} delayMs={(index % 4) * 60}>
              <article className="marketing-card-lift flex h-full flex-col rounded-[var(--radius-lg)] border border-border/70 bg-card p-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-spark/20 text-sm font-semibold text-primary"
                    aria-hidden
                  >
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.role} · {item.company}
                    </p>
                  </div>
                </div>
                <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground">
                  “{item.quote}”
                </blockquote>
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {item.industry}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {item.result}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
