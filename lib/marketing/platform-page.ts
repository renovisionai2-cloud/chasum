/**
 * Platform page story copy — Final Polish Sprint.
 * Presentation only; does not change product scope or routes.
 */

import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
  PRODUCT_TOUR_HREF,
} from "@/lib/marketing/alpha";
import { CHASUM_SUPPORTING_LINE } from "@/lib/marketing/os-positioning";

export const PLATFORM_STORY = {
  eyebrow: "Platform",
  headline: "One intelligent operating system.",
  lede: "Chasum is an AI Business Operating System for service businesses. Scheduling, customers, staff, payments, communications, reporting, automation, and AI share one Business Brain—so every department works from the same connected context.",
  layers: [
    "Scheduling.",
    "Customers.",
    "Staff.",
    "Payments.",
    "Communications.",
    "Reporting.",
    "Automation.",
    "AI.",
  ] as const,
  close: CHASUM_SUPPORTING_LINE,
  bridgeToShowcase:
    "Explore each department below—and notice how they stay connected.",
} as const;

export const PLATFORM_SHOWCASE = {
  eyebrow: "Inside the operating system",
  headline: "See how every department shares one Business Brain",
  lede: "Choose a department to preview how Chasum coordinates the day. The surfaces are illustrative—the intelligence is shared.",
  bridgeToConclusion:
    "When context is shared, recommendations, alerts and insights appear where work already happens—without a separate AI layer to manage.",
} as const;

/** Subtle embedded intelligence — capability signals, never promotional banners. */
export const PLATFORM_DEPARTMENT_SIGNALS: Record<string, string> = {
  dashboard:
    "Surfaces what needs attention before the day gets busy.",
  summer:
    "Answers from real hours, services and availability—never invented slots.",
  crm: "Brings history forward so the next conversation starts with context.",
  calendar:
    "Keeps openings, staff and rooms aligned in one shared schedule.",
  employees:
    "Connects roles and capacity to the same day the business is running.",
  business:
    "Holds the rules every other department reads from.",
  reports:
    "Turns shared activity into clear observations—not disconnected spreadsheets.",
  communication:
    "Keeps follow-ups tied to the customer and the appointment.",
  billing:
    "Records commerce beside the same customer and service context.",
};

export const PLATFORM_CONCLUSION = {
  eyebrow: "The operating system",
  headline: "One platform for the entire business.",
  body: "Instead of managing multiple disconnected systems, Chasum becomes the single operating system that understands and coordinates the entire business—one platform, one memory, one intelligence.",
  pillars: [
    "One platform",
    "One memory",
    "One intelligence",
    "One operating system",
  ] as const,
  primaryCta: {
    label: "Explore the Product",
    href: PRODUCT_TOUR_HREF,
  },
  secondaryCta: {
    label: CTA_MEET_SUMMER_LABEL,
    href: MEET_SUMMER_HREF,
  },
  tertiaryCta: {
    label: CTA_APPLY_LABEL,
    href: APPLY_HREF,
  },
} as const;
