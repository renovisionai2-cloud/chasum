import { Reveal } from "@/components/landing/reveal";
import { FAQ_ITEMS } from "@/lib/marketing/homepage";

export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 px-6 py-20 md:py-28"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center">
            <h2
              id="faq-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Frequently asked questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Straight answers about the product you will actually use.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <Reveal key={item.q} delayMs={Math.min(index * 40, 200)}>
              <details className="marketing-card-lift group rounded-[var(--radius-md)] border border-border/70 bg-card px-4 py-3 open:border-primary/30">
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
