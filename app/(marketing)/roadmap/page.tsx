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
  title: "Roadmap",
  description:
    "Chasum public roadmap — Available Today, Coming Next, and Future Vision. Honest Early Access labeling.",
};

const AVAILABLE_TODAY = [
  "Calendar, Day View, and Booking Sheet for front-desk operations",
  "Public online booking with real availability (no invented slots)",
  "CRM profiles, timeline, and customer history",
  "Services, employees, locations, and business configuration",
  "Email confirmations and reminders (when messaging is configured)",
  "Summer — AI receptionist (Early Access)",
  "Chase — operations insights (Early Access, read-only)",
  "Manual payment recording and commerce ledger (Early Access)",
] as const;

const COMING_NEXT = [
  "Self-serve subscription billing (Stripe)",
  "Card deposits / Stripe Elements in Booking Sheet",
  "Staff invitations and role-based access",
  "Help center and status automation",
  "Deeper Summer channels and Chase forecasts (grounded only)",
] as const;

const FUTURE_VISION = [
  "Full AI Workforce roster beyond Summer and Chase",
  "Native mobile apps",
  "Advanced marketplace and franchise tooling",
  "Voice channel for receptionist",
] as const;

function RoadmapList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "today" | "next" | "future";
  items: readonly string[];
}) {
  const badge =
    tone === "today"
      ? "bg-success/15 text-success"
      : tone === "next"
        ? "bg-primary/15 text-primary"
        : "bg-muted text-muted-foreground";

  return (
    <section className="rounded-2xl border border-border/70 bg-card/50 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}>
          {tone === "today" ? "Ships now" : tone === "next" ? "In progress" : "Vision"}
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
      eyebrow="Product"
      title="Public roadmap"
      description="What you can run today, what we are building next, and where we are headed — labeled honestly for Private Alpha."
    >
      <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
        Early Access features are real and usable with design partners, but still
        evolving. They are not marketed as finished “enterprise complete”
        products.{" "}
        <Link href={PRIVATE_ALPHA_HREF} className="font-medium text-primary hover:underline">
          Why Private Alpha?
        </Link>
      </p>

      <RoadmapList title="Available Today" tone="today" items={AVAILABLE_TODAY} />
      <RoadmapList title="Coming Next" tone="next" items={COMING_NEXT} />
      <RoadmapList title="Future Vision" tone="future" items={FUTURE_VISION} />

      <Link href={APPLY_HREF}>
        <Button size="lg" className="rounded-full px-8">
          {CTA_APPLY_LABEL}
        </Button>
      </Link>
    </MarketingDocPage>
  );
}
