"use client";

import { Reveal } from "@/components/landing/reveal";
import { INDUSTRIES } from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";
import {
  BriefcaseBusiness,
  Camera,
  Car,
  ChevronDown,
  Dumbbell,
  Hammer,
  PawPrint,
  Scissors,
  Sparkles,
  SprayCan,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "Medical Clinics": Stethoscope,
  Salons: Scissors,
  Spas: Sparkles,
  Gyms: Dumbbell,
  Automotive: Car,
  Contractors: Hammer,
  Photography: Camera,
  "Pet Services": PawPrint,
  Cleaning: SprayCan,
  "Professional Services": BriefcaseBusiness,
};

export function Industries() {
  const [open, setOpen] = useState<string | null>(INDUSTRIES[0]?.name ?? null);

  return (
    <section
      id="industries"
      className="scroll-mt-20 px-6 py-24 md:py-36"
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

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry, index) => {
            const expanded = open === industry.name;
            const Icon = INDUSTRY_ICONS[industry.name] ?? BriefcaseBusiness;
            return (
              <Reveal key={industry.name} delayMs={(index % 3) * 70}>
                <article
                  className={cn(
                    "marketing-card-lift group overflow-hidden rounded-[var(--radius-lg)] border bg-card transition-colors",
                    expanded
                      ? "border-primary/40 shadow-lg shadow-primary/[0.06]"
                      : "border-border/70",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-h-36 w-full items-start justify-between gap-4 p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-expanded={expanded}
                    onClick={() =>
                      setOpen(expanded ? null : industry.name)
                    }
                  >
                    <span>
                      <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">
                        {industry.name}
                      </h3>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Explore workflows and modules
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                        expanded && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-500 ease-out",
                      expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-4 border-t border-border/60 bg-muted/20 px-6 pb-6 pt-5">
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
