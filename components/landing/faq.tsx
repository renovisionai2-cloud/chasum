import { Reveal } from "@/components/landing/reveal";
import { FAQ_ITEMS } from "@/lib/marketing/homepage";

/**
 * V3 FAQ — premium knowledge center with large type and calm interactions.
 */
export function Faq() {
  return (
    <section
      id="faq"
      className="marketing-surface-tint marketing-hairline-y scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center">
            <p className="marketing-eyebrow">Resources</p>
            <h2 id="faq-heading" className="marketing-h2-xl">
              Frequently asked questions
            </h2>
            <p className="marketing-lede">
              Straight answers about the product you will actually use.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <Reveal key={item.q} delayMs={Math.min(index * 35, 180)}>
              <details className="marketing-card-lift group rounded-[1.15rem] border border-border/60 bg-card px-6 py-5 open:border-primary/25 open:shadow-md">
                <summary className="cursor-pointer list-none text-base font-semibold tracking-tight text-foreground marker:content-none [&::-webkit-details-marker]:hidden md:text-lg">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-lg text-muted-foreground transition duration-200 group-open:rotate-45 group-open:bg-primary/10 group-open:text-primary">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
