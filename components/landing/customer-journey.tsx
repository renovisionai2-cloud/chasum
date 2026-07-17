import { Reveal } from "@/components/landing/reveal";
import { CUSTOMER_JOURNEY } from "@/lib/marketing/homepage";
import { ArrowDown } from "lucide-react";

export function CustomerJourney() {
  return (
    <section
      id="journey"
      className="scroll-mt-20 px-6 py-24 md:py-36"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <div className="text-center">
            <p className="marketing-eyebrow">How it works</p>
            <h2 id="journey-heading" className="marketing-h2">
              One complete customer journey
            </h2>
            <p className="marketing-lede">
              From first booking to reported revenue — departments stay connected.
            </p>
          </div>
        </Reveal>

        <ol className="mt-16 flex flex-col items-stretch">
          {CUSTOMER_JOURNEY.map((item, index) => (
            <Reveal key={item.step} delayMs={index * 45}>
              <li className="flex flex-col items-center">
                <div className="marketing-card-lift marketing-elevate w-full rounded-[var(--radius-lg)] border border-border/60 bg-card p-5 text-center sm:text-left">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <span className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground sm:mx-0">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
                {index < CUSTOMER_JOURNEY.length - 1 ? (
                  <div
                    className="flex flex-col items-center py-2 text-primary/70"
                    aria-hidden
                  >
                    <div className="h-3 w-px bg-border" />
                    <ArrowDown className="h-4 w-4" />
                    <div className="h-3 w-px bg-border" />
                  </div>
                ) : null}
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
