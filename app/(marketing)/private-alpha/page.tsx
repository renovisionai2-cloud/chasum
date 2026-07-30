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
    "Help shape Chasum around real work. Limited design partners receive guided onboarding, founder access, and Early Access to Summer and Chase.",
};

const BENEFITS = [
  {
    title: "Direct founder access",
    body: "Speak with the people building Chasum when feedback or a blocker matters.",
  },
  {
    title: "Guided onboarding",
    body: "We help configure the platform around the workflows currently supported.",
  },
  {
    title: "Roadmap influence",
    body: "Your real operating experience helps determine what should be improved next.",
  },
  {
    title: "Founding terms",
    body: "Access, pricing and included capabilities are confirmed clearly during onboarding.",
  },
  {
    title: "Early access to Summer and Chase",
    body: "Use the verified Early Access capabilities documented in the Product Truth Matrix—Summer as AI Business Manager and Chase for read-only operations insights.",
  },
] as const;

export default function WhyPrivateAlphaPage() {
  return (
    <MarketingDocPage
      eyebrow="Private Alpha"
      title="Help shape Chasum around real work."
      description="We are partnering with a limited number of service businesses before opening public access. You receive direct support and meaningful influence. We receive the responsibility to solve real operational problems—not imagined ones."
    >
      <div className="space-y-6">
        {BENEFITS.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border/70 bg-card/60 px-5 py-4"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground">
        That is how we earn your trust before broader launch. We will not
        pretend the full AI Workforce roster, card checkout, or self-serve
        subscriptions are finished. Those sit on the{" "}
        <Link href={ROADMAP_HREF} className="text-primary hover:underline">
          roadmap
        </Link>{" "}
        as Coming Next or Future Vision.
      </p>

      <section className="rounded-2xl border border-border/70 bg-muted/30 px-5 py-5">
        <h2 className="text-lg font-semibold text-foreground">
          What Private Alpha is not
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>It is not a finished enterprise product.</li>
          <li>It is not open self-serve signup.</li>
          <li>Roadmap features are not presented as available today.</li>
          <li>
            Production-critical guarantees require a separate written agreement.
          </li>
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={APPLY_HREF}>
          <Button size="lg" className="rounded-full px-8">
            {CTA_APPLY_LABEL}
          </Button>
        </Link>
        <Link href={DEMO_HREF}>
          <Button variant="outline" size="lg" className="rounded-full px-8">
            {CTA_DEMO_LABEL}
          </Button>
        </Link>
      </div>
    </MarketingDocPage>
  );
}
