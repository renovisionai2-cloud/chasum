import { Reveal } from "@/components/landing/reveal";
import { LOGO_CLOUD } from "@/lib/marketing/homepage";

export function LogoCloud() {
  return (
    <section
      className="px-6 py-16 md:py-20"
      aria-labelledby="logo-cloud-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="text-center">
            <p
              id="logo-cloud-heading"
              className="text-sm font-medium text-muted-foreground"
            >
              Trusted by growing service brands
            </p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Placeholder partners until launch — real logos coming soon.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {LOGO_CLOUD.map((brand) => (
              <li
                key={brand}
                className="marketing-card-lift flex min-h-16 items-center justify-center rounded-[var(--radius-md)] border border-border/60 bg-card/70 px-4 py-5 text-center"
              >
                <span className="text-sm font-semibold tracking-tight text-foreground/70">
                  {brand}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
