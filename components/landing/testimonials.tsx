import { Reveal } from "@/components/landing/reveal";
import { TESTIMONIALS } from "@/lib/marketing/homepage";

/**
 * V3 Customer Stories — emotional, photographic, trust-building.
 */
export function Testimonials() {
  const [featured, ...rest] = TESTIMONIALS;

  return (
    <section
      id="stories"
      className="marketing-section-contain scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="stories-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">Customers</p>
            <h2 id="stories-heading" className="marketing-h2-xl">
              Results operators can feel
            </h2>
            <p className="marketing-lede">
              Illustrative early-partner stories — real photos and verified case
              studies will replace these placeholders at launch.
            </p>
          </div>
        </Reveal>

        {featured ? (
          <Reveal delayMs={60}>
            <article className="marketing-elevate-lg mt-14 grid overflow-hidden rounded-[1.75rem] border border-border/60 bg-card lg:grid-cols-[0.9fr_1.1fr]">
              <div
                className="relative flex min-h-[280px] items-end bg-gradient-to-br from-primary/20 via-muted to-spark/15 p-8 md:min-h-[360px] md:p-10"
                aria-hidden
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-2xl font-semibold text-primary shadow-lg">
                    {featured.initials}
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground/80">
                    Photo placeholder
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Featured story
                </p>
                <blockquote className="mt-5 text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-3xl md:leading-snug">
                  “{featured.quote}”
                </blockquote>
                <div className="mt-8">
                  <p className="text-base font-semibold text-foreground">
                    {featured.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {featured.role} · {featured.company}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {featured.industry}
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {featured.result}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rest.map((item, index) => (
            <Reveal key={item.company} delayMs={(index % 4) * 50}>
              <article className="marketing-card-lift flex h-full flex-col rounded-[1.35rem] border border-border/60 bg-card p-6">
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
