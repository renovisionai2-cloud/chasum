import { Button } from "@/components/ui/button";
import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  DEMO_HREF,
  CTA_DEMO_LABEL,
} from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Chasum for Private Alpha, demos, and support.",
};

export default function ContactPage() {
  return (
    <MarketingDocPage
      eyebrow="Support"
      title="Contact"
      description="Design partners get direct founder access. For new applications and walkthroughs, use the paths below."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
          <h2 className="font-semibold text-foreground">Private Alpha</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Apply to work with us as a design partner.
          </p>
          <Link href={APPLY_HREF} className="mt-4 inline-block">
            <Button className="rounded-full">{CTA_APPLY_LABEL}</Button>
          </Link>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
          <h2 className="font-semibold text-foreground">Walkthrough</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Email the team to schedule a product walkthrough.
          </p>
          <a href={DEMO_HREF} className="mt-4 inline-block">
            <Button variant="outline" className="rounded-full">
              {CTA_DEMO_LABEL}
            </Button>
          </a>
        </div>
      </div>
      <p className="text-muted-foreground">
        Email:{" "}
        <a
          href="mailto:sales@chasum.app"
          className="font-medium text-primary hover:underline"
        >
          sales@chasum.app
        </a>
      </p>
    </MarketingDocPage>
  );
}
