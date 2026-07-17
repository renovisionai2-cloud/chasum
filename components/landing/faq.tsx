import { Reveal } from "@/components/landing/reveal";
import { FAQ_ITEMS } from "@/lib/marketing/homepage";

export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 px-6 py-24 md:py-36"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center">
            <p className="marketing-eyebrow">FAQ</p>
            <h2 id="faq-heading" className="marketing-h2">
              Frequently asked questions
            </h2>
            <p className="marketing-lede">
              Straight answers about the product you will actually use.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <Reveal key={item.q} delayMs={Math.min(index * 40, 200)}>
              <details className="marketing-card-lift group rounded-[var(--radius-md)] border border-border/70 bg-card px-5 py-4 open:border-primary/30 open:shadow-sm">
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-muted-foreground transition duration-200 group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
