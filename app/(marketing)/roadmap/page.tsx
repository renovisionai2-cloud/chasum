import { Button } from "@/components/ui/button";
import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  PRIVATE_ALPHA_HREF,
} from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Public Roadmap",
  description:
    "What is available now—and what is not. Available Today, Early Access, Coming Next, and Future Vision for Chasum Private Alpha.",
};

const LAST_REVIEWED = "2026-07-24";

const AVAILABLE_TODAY = [
  "Calendar, Day View, and Booking Sheet for front-desk operations",
  "Public online booking with real availability (no invented slots)",
  "CRM profiles, timeline, and customer history",
  "Services, employees, locations, and business configuration",
  "Email confirmations and reminders when messaging is configured",
  "Waitlist when enabled on the business",
  "Manual payment recording and gift certificates",
  "Revenue and operational reports from recorded activity",
  "Optional Google and Microsoft/Outlook busy-time assist when configured",
  "Apple Calendar via ICS subscribe (not full two-way OAuth sync)",
] as const;

const EARLY_ACCESS = [
  "Summer — AI Business Assistant (website concierge, product guide, reception and booking assistance where configured)",
  "Chase — AI Operations Insights (read-only operational observations and summaries)",
  "SMS delivery when Twilio and plan settings are enabled",
  "Operator invoices and receipts from recorded transactions",
  "Commerce ledger for supported payment types",
] as const;

const COMING_NEXT = [
  "Self-serve subscription billing (Stripe)",
  "Card deposits / Stripe Elements in Booking Sheet",
  "Staff invitations and multi-user login with role enforcement",
  "Help center and automated status history",
  "Alex — AI Scheduling",
  "Deeper Summer channels and Chase forecasts (grounded only)",
] as const;

const FUTURE_VISION = [
  "Maya — Marketing Intelligence",
  "Leo — Business Advisor",
  "Sophia — Customer Success",
  "Native mobile apps",
  "Advanced marketplace and franchise tooling",
  "Voice channel for receptionist",
] as const;

function RoadmapList({
  title,
  badge,
  badgeClass,
  items,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  items: readonly string[];
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/50 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RoadmapPage() {
  return (
    <MarketingDocPage
      eyebrow="Public roadmap"
      title="What is available now—and what is not."
      description="Private Alpha works only when product status is clear. This roadmap separates usable capabilities from Early Access, active development and long-term vision."
    >
      <p className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Last reviewed: {LAST_REVIEWED}
      </p>

      <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
        Roadmap priorities may change as we learn from design partners. Status
        labels describe current product availability, not guaranteed delivery
        dates.{" "}
        <Link
          href={PRIVATE_ALPHA_HREF}
          className="font-medium text-primary hover:underline"
        >
          Why Private Alpha?
        </Link>
      </p>

      <RoadmapList
        title="Available Today"
        badge="Design partners"
        badgeClass="bg-success/15 text-success"
        items={AVAILABLE_TODAY}
      />
      <RoadmapList
        title="Early Access"
        badge="Evolving"
        badgeClass="bg-primary/15 text-primary"
        items={EARLY_ACCESS}
      />
      <RoadmapList
        title="Coming Next"
        badge="In progress"
        badgeClass="bg-spark-muted text-spark"
        items={COMING_NEXT}
      />
      <RoadmapList
        title="Future Vision"
        badge="Long-term"
        badgeClass="bg-muted text-muted-foreground"
        items={FUTURE_VISION}
      />

      <Link href={APPLY_HREF}>
        <Button size="lg" className="rounded-full px-8">
          {CTA_APPLY_LABEL}
        </Button>
      </Link>
    </MarketingDocPage>
  );
}
