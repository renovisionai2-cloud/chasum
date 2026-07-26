"use client";

import { Reveal } from "@/components/landing/reveal";
import { INDUSTRIES_HREF } from "@/lib/marketing/alpha";
import {
  BriefcaseBusiness,
  Camera,
  Car,
  Dumbbell,
  GraduationCap,
  Hammer,
  HeartPulse,
  PawPrint,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/** Homepage industry tiles — category presentation, not compliance claims. */
export const HOMEPAGE_INDUSTRY_TILES: ReadonlyArray<{
  name: string;
  icon: LucideIcon;
}> = [
  { name: "Healthcare", icon: HeartPulse },
  { name: "Beauty & Personal Care", icon: Sparkles },
  { name: "Fitness & Wellness", icon: Dumbbell },
  { name: "Home & Construction Services", icon: Hammer },
  { name: "Automotive", icon: Car },
  { name: "Professional Services", icon: BriefcaseBusiness },
  { name: "Photography & Creative", icon: Camera },
  { name: "Pet Services", icon: PawPrint },
  { name: "Education", icon: GraduationCap },
];

/**
 * Industries — premium selection tiles on the homepage.
 */
export function HomepageIndustries() {
  return (
    <section
      id="industries"
      className="marketing-surface-tint marketing-hairline-y scroll-mt-24 px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="industries-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">
              Built around how your business actually works
            </p>
            <h2 id="industries-heading" className="marketing-h2-xl">
              Every service business works differently.
            </h2>
            <p className="marketing-lede">
              Chasum provides a connected operating foundation that can be
              configured around the people, services, locations and workflows
              that make each business unique.
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-3">
          {HOMEPAGE_INDUSTRY_TILES.map((tile, index) => {
            const Icon = tile.icon;
            return (
              <Reveal key={tile.name} delayMs={Math.min(index * 40, 200)}>
                <li>
                  <Link
                    href={INDUSTRIES_HREF}
                    className="marketing-focus-ring flex min-h-[5.5rem] flex-col items-start justify-between rounded-2xl border border-border/60 bg-card/70 p-4 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:min-h-[6.25rem] sm:p-5"
                  >
                    <Icon
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="mt-3 text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
                      {tile.name}
                    </span>
                  </Link>
                </li>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delayMs={160}>
          <div className="mt-10 text-center">
            <Link
              href={INDUSTRIES_HREF}
              className="marketing-focus-ring inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Explore all industries →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
