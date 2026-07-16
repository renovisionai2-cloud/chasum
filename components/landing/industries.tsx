import { INDUSTRIES } from "@/lib/marketing/homepage";

export function Industries() {
  return (
    <section id="industries" className="px-6 py-20 md:py-28" aria-labelledby="industries-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="industries-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            Built for service industries
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One platform. Configure for your vertical — without forking the product.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <article
              key={industry.name}
              className="rounded-[var(--radius-md)] border border-border/70 bg-card p-5 transition-colors hover:border-primary/30"
            >
              <h3 className="text-base font-semibold text-foreground">
                {industry.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Challenge: </span>
                {industry.problem}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Chasum: </span>
                {industry.solution}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
