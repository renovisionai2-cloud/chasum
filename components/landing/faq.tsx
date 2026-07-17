"use client";

import { Reveal } from "@/components/landing/reveal";
import { FAQ_ITEMS } from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

/**
 * Launch-polish FAQ — smooth accordion, rotating icon, keyboard-friendly.
 */
export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section
      id="faq"
      className="marketing-section-contain marketing-surface-tint marketing-hairline-y scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center">
            <p className="marketing-eyebrow">Resources</p>
            <h2 id="faq-heading" className="marketing-h2-xl">
              Frequently Asked Questions
            </h2>
            <p className="marketing-lede">
              Clear answers about the product you will actually use.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <Reveal key={item.q} delayMs={Math.min(index * 35, 180)}>
                <div
                  className={cn(
                    "marketing-faq-item rounded-[1.15rem] border bg-card px-6 py-2",
                    open
                      ? "border-primary/25 shadow-md shadow-foreground/[0.04]"
                      : "border-border/60",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="marketing-focus-ring flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left text-base font-semibold tracking-tight text-foreground md:text-lg"
                      onClick={() => setOpenIndex(open ? null : index)}
                    >
                      {item.q}
                      <span
                        className="marketing-faq-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-lg leading-none text-muted-foreground"
                        data-open={open}
                        aria-hidden
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="marketing-faq-panel"
                    data-open={open}
                    aria-hidden={!open}
                    inert={!open ? true : undefined}
                  >
                    <div className="marketing-faq-panel-inner">
                      <p className="max-w-2xl pb-4 text-base leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
