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
  blurb: string;
  icon: LucideIcon;
}> = [
  {
    name: "Healthcare",
    blurb:
      "Designed for clinics where every appointment and follow-up matters.",
    icon: HeartPulse,
  },
  {
    name: "Beauty & Personal Care",
    blurb: "Built around busy schedules and repeat clients.",
    icon: Sparkles,
  },
  {
    name: "Fitness & Wellness",
    blurb: "Coordinate memberships, bookings and staff.",
    icon: Dumbbell,
  },
  {
    name: "Home & Construction Services",
    blurb:
      "Coordinate customers, crews and projects from one connected operating system.",
    icon: Hammer,
  },
  {
    name: "Automotive",
    blurb: "Keep repairs, customers and communication connected.",
    icon: Car,
  },
  {
    name: "Professional Services",
    blurb: "Organize clients, appointments and relationships.",
    icon: BriefcaseBusiness,
  },
  {
    name: "Photography & Creative",
    blurb: "Manage sessions, communication and follow-up.",
    icon: Camera,
  },
  {
    name: "Pet Services",
    blurb: "Run appointments, reminders and customer care.",
    icon: PawPrint,
  },
  {
    name: "Education",
    blurb: "Support instructors, scheduling and communication.",
    icon: GraduationCap,
  },
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

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-3">
          {HOMEPAGE_INDUSTRY_TILES.map((tile, index) => {
            const Icon = tile.icon;
            return (
              <Reveal key={tile.name} delayMs={Math.min(index * 40, 200)}>
                <li>
                  <Link
                    href={INDUSTRIES_HREF}
                    className="fd-industry-tile marketing-focus-ring flex min-h-[7.5rem] flex-col items-start rounded-2xl border border-border/60 bg-card/70 p-4 sm:min-h-[8.25rem] sm:p-5"
                  >
                    <Icon
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="mt-3 text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
                      {tile.name}
                    </span>
                    <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                      {tile.blurb}
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
