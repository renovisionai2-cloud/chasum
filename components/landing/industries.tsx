"use client";

import { Reveal } from "@/components/landing/reveal";
import { INDUSTRIES } from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function Industries() {
  const [open, setOpen] = useState<string | null>(INDUSTRIES[0]?.name ?? null);

  return (
    <section
      id="industries"
      className="scroll-mt-20 px-6 py-20 md:py-28"
      aria-labelledby="industries-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="industries-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Built for service industries
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore each vertical — challenges, how Chasum helps, and the
              modules that matter most.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry, index) => {
            const expanded = open === industry.name;
            return (
              <Reveal key={industry.name} delayMs={(index % 3) * 70}>
                <article
                  className={cn(
                    "marketing-card-lift rounded-[var(--radius-md)] border bg-card transition-colors",
                    expanded ? "border-primary/40" : "border-border/70",
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 p-5 text-left"
                    aria-expanded={expanded}
                    onClick={() =>
                      setOpen(expanded ? null : industry.name)
                    }
                  >
                    <h3 className="text-base font-semibold text-foreground">
                      {industry.name}
                    </h3>
                    <ChevronDown
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        expanded && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-3 border-t border-border/60 px-5 pb-5 pt-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Challenges:{" "}
                          </span>
                          {industry.problem}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            How Chasum helps:{" "}
                          </span>
                          {industry.solution}
                        </p>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Recommended modules
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {industry.modules.map((mod) => (
                              <li
                                key={mod}
                                className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                              >
                                {mod}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
