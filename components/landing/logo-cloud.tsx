import { Reveal } from "@/components/landing/reveal";
import { LOGO_CLOUD } from "@/lib/marketing/homepage";

export function LogoCloud() {
  return (
    <section
      className="marketing-hairline-b px-6 py-20 md:py-24"
      aria-labelledby="logo-cloud-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="text-center">
            <p
              id="logo-cloud-heading"
              className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              Trusted by growing service brands
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 md:mt-14 md:gap-5">
            {LOGO_CLOUD.map((brand) => (
              <li
                key={brand}
                className="marketing-card-lift marketing-panel flex min-h-[4.5rem] items-center justify-center rounded-[var(--radius-lg)] px-5 py-6 text-center md:min-h-[5.5rem]"
              >
                <span className="text-base font-semibold tracking-tight text-foreground/60 transition-colors duration-300 hover:text-foreground/85 md:text-lg">
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
