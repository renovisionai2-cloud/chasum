"use client";

import { Reveal } from "@/components/landing/reveal";
import { INDUSTRIES_HREF } from "@/lib/marketing/alpha";
import { getIndustryImage } from "@/lib/marketing/industryImages";
import {
  BriefcaseBusiness,
  Camera,
  Car,
  Dumbbell,
  GraduationCap,
  Hammer,
  HeartPulse,
  PawPrint,
  Scale,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Homepage industry tiles — category presentation, not compliance claims.
 * Legal Services is a dedicated tile (not folded into Professional Services).
 * Healthcare maps to Medical Clinics and related care businesses.
 */
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
    name: "Legal Services",
    blurb:
      "Designed for consultations, client communication and scheduling.",
    icon: Scale,
  },
  {
    name: "Beauty & Personal Care",
    blurb: "Built around busy schedules and repeat clients.",
    icon: Sparkles,
  },
  {
    name: "Fitness & Wellness",
    blurb: "Helps coordinate bookings, staff and memberships.",
    icon: Dumbbell,
  },
  {
    name: "Home & Construction Services",
    blurb:
      "Helps coordinate scheduling, crews and customer communication.",
    icon: Hammer,
  },
  {
    name: "Automotive Services",
    blurb:
      "Built for appointments, customer communication, scheduling and service-team coordination.",
    icon: Car,
  },
  {
    name: "Professional Services",
    blurb: "Helps organize clients, appointments and relationships.",
    icon: BriefcaseBusiness,
  },
  {
    name: "Photography & Creative",
    blurb: "Helps manage sessions, communication and follow-up.",
    icon: Camera,
  },
  {
    name: "Pet Services",
    blurb: "Helps run appointments, reminders and customer care.",
    icon: PawPrint,
  },
  {
    name: "Education",
    blurb: "Helps support instructors, scheduling and communication.",
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
            const visual = getIndustryImage(tile.name);
            return (
              <Reveal key={tile.name} delayMs={Math.min(index * 40, 200)}>
                <li>
                  <Link
                    href={INDUSTRIES_HREF}
                    className="fd-industry-tile marketing-focus-ring relative flex min-h-[11.5rem] flex-col justify-end overflow-hidden rounded-2xl border border-border/60 sm:min-h-[12.75rem]"
                  >
                    {visual ? (
                      <Image
                        src={visual.thumbnail}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 420px"
                        className="fd-industry-tile-img object-cover"
                        style={
                          visual.objectPosition
                            ? { objectPosition: visual.objectPosition }
                            : undefined
                        }
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="absolute inset-0 bg-muted"
                        aria-hidden
                      />
                    )}
                    <span
                      className="fd-industry-tile-overlay pointer-events-none absolute inset-0"
                      aria-hidden
                    />
                    <span className="relative z-[1] flex flex-col items-start p-4 sm:p-5">
                      <Icon
                        className="h-5 w-5 text-white/90"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="mt-3 text-sm font-semibold tracking-tight text-white sm:text-[15px]">
                        {tile.name}
                      </span>
                      <span className="mt-1.5 text-xs leading-relaxed text-white/80 sm:text-[13px]">
                        {tile.blurb}
                      </span>
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
