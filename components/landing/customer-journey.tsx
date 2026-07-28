import { Reveal } from "@/components/landing/reveal";
import {
  PRODUCT_TOUR_INTRO,
  PRODUCT_TOUR_JOURNEY,
} from "@/lib/marketing/product-tour-page";

/**
 * Customer journey — single ordered list that reflows (no duplicate AT content).
 * Each stop leads with why it matters, then how it works.
 */
export function CustomerJourney() {
  return (
    <section
      id="how-it-works"
      className="marketing-section-contain scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">{PRODUCT_TOUR_INTRO.eyebrow}</p>
            <h1 id="journey-heading" className="marketing-h2-xl">
              {PRODUCT_TOUR_INTRO.headline}
            </h1>
            <p className="marketing-lede" id="journey">
              {PRODUCT_TOUR_INTRO.lede}
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="relative mt-12 lg:mt-16">
            <div
              className="marketing-journey-line absolute left-[6%] right-[6%] top-[2.75rem] hidden h-px lg:block"
              aria-hidden
            />
            <ol className="grid gap-3 lg:grid-cols-7">
              {PRODUCT_TOUR_JOURNEY.map((item, index) => (
                <li
                  key={item.step}
                  className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:text-center"
                >
                  <div className="flex items-start gap-4 lg:flex-col lg:items-center">
                    <div className="marketing-journey-node relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm lg:h-14 lg:w-14 lg:border lg:border-border/70 lg:bg-card lg:text-primary">
                      {item.step}
                    </div>
                    <div className="min-w-0 lg:mt-5">
                      <h3 className="text-base font-semibold tracking-tight text-foreground lg:text-sm">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-foreground/90 lg:mt-2 lg:text-xs">
                        {item.why}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground lg:text-xs">
                        {item.detail}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground/90 lg:mt-2.5">
                        <span className="font-medium text-primary/90">
                          {item.moment.kind}.
                        </span>{" "}
                        {item.moment.text}
                      </p>
                      {index < PRODUCT_TOUR_JOURNEY.length - 1 ? (
                        <span className="sr-only">then</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal delayMs={140}>
          <p className="mx-auto mt-12 max-w-2xl text-center text-base text-muted-foreground md:mt-14 md:text-lg">
            {PRODUCT_TOUR_INTRO.bridgeToShowcase}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
