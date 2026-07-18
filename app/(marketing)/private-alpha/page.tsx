import { Button } from "@/components/ui/button";
import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  DEMO_HREF,
  ROADMAP_HREF,
} from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Private Alpha?",
  description:
    "Chasum is inviting a limited number of design partners. Priority support, founder access, roadmap influence, and founding customer pricing.",
};

const BENEFITS = [
  {
    title: "Priority support",
    body: "Same-business-day responses from the people building the product — not a ticket queue.",
  },
  {
    title: "Direct founder access",
    body: "Walkthroughs, feedback sessions, and a shared channel when something blocks your day.",
  },
  {
    title: "Influence on the roadmap",
    body: "Your real workflows shape what we ship next. See what is Available Today vs Coming Next on our public roadmap.",
  },
  {
    title: "Founding customer pricing",
    body: "Design partners lock in founding rates before public self-serve billing launches.",
  },
  {
    title: "Early access to Summer and Chase",
    body: "Summer (AI receptionist) and Chase (operations insights) are in Early Access — grounded in your real data, expanded carefully.",
  },
] as const;

export default function WhyPrivateAlphaPage() {
  return (
    <MarketingDocPage
      eyebrow="Private Alpha"
      title="Why Private Alpha?"
      description="We're working closely with a limited number of businesses before opening the doors. That is how we earn the right to charge — and how you get a product that fits how you actually operate."
    >
      <div className="space-y-6">
        {BENEFITS.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border/70 bg-card/60 px-5 py-4"
          >
            <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground">
        We will not pretend the full AI Workforce roster, card checkout, or
        self-serve subscriptions are finished. Those sit on the{" "}
        <Link href={ROADMAP_HREF} className="text-primary hover:underline">
          roadmap
        </Link>{" "}
        as Coming Next or Future Vision.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={APPLY_HREF}>
          <Button size="lg" className="rounded-full px-8">
            {CTA_APPLY_LABEL}
          </Button>
        </Link>
        <a href={DEMO_HREF}>
          <Button variant="outline" size="lg" className="rounded-full px-8">
            {CTA_DEMO_LABEL}
          </Button>
        </a>
      </div>
    </MarketingDocPage>
  );
}
