import { Reveal } from "@/components/landing/reveal";
import {
  PRODUCT_TOUR_INTRO,
  PRODUCT_TOUR_JOURNEY,
} from "@/lib/marketing/product-tour-page";

/**
 * Customer journey — visual refinement only.
 * Copy and story order are unchanged.
 */
export function CustomerJourney() {
  return (
    <section
      id="how-it-works"
      className="pt-journey marketing-section-contain scroll-mt-24 px-6 py-16 md:py-24"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="pt-journey-intro mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">{PRODUCT_TOUR_INTRO.eyebrow}</p>
            <h1 id="journey-heading" className="marketing-h2-xl">
              {PRODUCT_TOUR_INTRO.headline}
            </h1>
            <p className="pt-journey-lede marketing-lede" id="journey">
              {PRODUCT_TOUR_INTRO.lede}
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="pt-journey-stage relative">
            <div className="pt-journey-rail-wrap" aria-hidden>
              <div className="marketing-journey-line pt-journey-rail" />
              <span className="pt-journey-pulse" />
            </div>

            <ol className="pt-journey-grid">
              {PRODUCT_TOUR_JOURNEY.map((item, index) => (
                <li key={item.step} className="pt-journey-card">
                  <div className="pt-journey-card-inner">
                    <div className="marketing-journey-node pt-journey-node">
                      <span className="pt-journey-node-label">{item.step}</span>
                    </div>
                    <div className="pt-journey-copy">
                      <h3 className="pt-journey-title">{item.title}</h3>
                      <p className="pt-journey-why">{item.why}</p>
                      <p className="pt-journey-detail">{item.detail}</p>
                      <p className="pt-journey-moment">
                        <span className="pt-journey-moment-kind">
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
          <p className="pt-journey-bridge mx-auto max-w-2xl text-center text-muted-foreground">
            {PRODUCT_TOUR_INTRO.bridgeToShowcase}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
