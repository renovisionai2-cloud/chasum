import { CUSTOMER_JOURNEY } from "@/lib/marketing/homepage";

export function CustomerJourney() {
  return (
    <section
      id="journey"
      className="border-y border-border bg-muted/30 px-6 py-20 md:py-28"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="journey-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            One complete customer journey
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From first inquiry to reported revenue — departments stay connected.
          </p>
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CUSTOMER_JOURNEY.map((item) => (
            <li
              key={item.step}
              className="relative rounded-[var(--radius-md)] border border-border/70 bg-card p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-sm font-semibold text-primary-foreground">
                {item.step}
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
