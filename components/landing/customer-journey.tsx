import { Reveal } from "@/components/landing/reveal";
import { CUSTOMER_JOURNEY } from "@/lib/marketing/homepage";

/**
 * V3 Customer Journey — connected OS workflow, not stacked boxes.
 */
export function CustomerJourney() {
  return (
    <section
      id="journey"
      className="marketing-section-contain scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">How it works</p>
            <h2 id="journey-heading" className="marketing-h2-xl">
              One complete customer journey
            </h2>
            <p className="marketing-lede">
              From first booking to reported revenue — every department stays
              connected.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="relative mt-16 hidden lg:block">
            <div
              className="marketing-journey-line absolute left-[6%] right-[6%] top-[2.75rem] h-px"
              aria-hidden
            />
            <ol className="grid grid-cols-7 gap-3">
              {CUSTOMER_JOURNEY.map((item, index) => (
                <li key={item.step} className="flex flex-col items-center text-center">
                  <div className="marketing-journey-node relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-card text-sm font-semibold text-primary shadow-sm">
                    {item.step}
                  </div>
                  <h3 className="mt-5 text-sm font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                  {index < CUSTOMER_JOURNEY.length - 1 ? (
                    <span className="sr-only">then</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <ol className="mt-12 space-y-3 lg:hidden">
          {CUSTOMER_JOURNEY.map((item, index) => (
            <Reveal key={item.step} delayMs={index * 40}>
              <li className="marketing-journey-node rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
