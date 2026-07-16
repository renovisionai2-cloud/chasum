import { TRUSTED_STATS } from "@/lib/marketing/homepage";

export function TrustedPlatform() {
  return (
    <section
      id="trusted"
      className="border-y border-border bg-muted/30 px-6 py-14 md:py-16"
      aria-labelledby="trusted-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="trusted-heading"
            className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            A trusted operating platform
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for real multi-tenant operations — not a single booking widget.
          </p>
        </div>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TRUSTED_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius-md)] border border-border/70 bg-card px-4 py-5 text-center"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
