import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  DEMO_MAILTO_FALLBACK,
  SECURITY_HREF,
} from "@/lib/marketing/alpha";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Apply for Private Alpha, book a product walkthrough, reach support, or report a security concern.",
};

const SUPPORT_MAILTO =
  "mailto:sales@chasumai.com?subject=Chasum%20Design%20Partner%20Support";
const SECURITY_MAILTO =
  "mailto:sales@chasumai.com?subject=Chasum%20Security%20Concern";

/** Contact-local walkthrough CTA — mailto request, not a calendar scheduler. */
const CONTACT_WALKTHROUGH_CTA_LABEL = "Request a Walkthrough";

const contactCtaBaseClassName =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-11 min-h-11 px-5 text-sm touch-manipulation rounded-full";

const contactCtaVariantClassName = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]",
  outline:
    "border border-border bg-card/60 hover:bg-muted text-foreground shadow-xs active:scale-[0.98]",
} as const;

function ContactCtaLink({
  href,
  children,
  variant,
  className,
}: {
  href: string;
  children: ReactNode;
  variant: "primary" | "outline";
  className?: string;
}) {
  const classes = cn(
    contactCtaBaseClassName,
    contactCtaVariantClassName[variant],
    className,
  );

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}

export default function ContactPage() {
  return (
    <MarketingDocPage
      eyebrow="Contact Chasum"
      title="Start with the conversation that fits you."
      description="Applying for Private Alpha, looking for a product walkthrough, or already working with us? Choose the right path below."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
          <h2 className="font-semibold text-foreground">Private Alpha</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For service businesses interested in becoming design partners.
          </p>
          <ContactCtaLink href={APPLY_HREF} variant="primary" className="mt-4">
            {CTA_APPLY_LABEL}
          </ContactCtaLink>
        </div>

        <div
          id="walkthrough"
          className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/60 p-5"
        >
          <h2 className="font-semibold text-foreground">Product Walkthrough</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For operators who want to understand the platform before applying.
          </p>
          <ContactCtaLink
            href={DEMO_MAILTO_FALLBACK}
            variant="outline"
            className="mt-4"
          >
            {CONTACT_WALKTHROUGH_CTA_LABEL}
          </ContactCtaLink>
          <p className="mt-3 text-xs text-muted-foreground">
            Opens email to sales@chasumai.com. Prefer applying first?{" "}
            <Link href={APPLY_HREF} className="text-primary hover:underline">
              Apply for Private Alpha
            </Link>
            .
          </p>
        </div>

        <div
          id="support"
          className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/60 p-5"
        >
          <h2 className="font-semibold text-foreground">
            Existing Design Partner
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For current design partners who need product support.
          </p>
          <ContactCtaLink
            href={SUPPORT_MAILTO}
            variant="outline"
            className="mt-4"
          >
            Contact Support
          </ContactCtaLink>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
          <h2 className="font-semibold text-foreground">Security Concern</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For responsible reporting of a potential security issue.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ContactCtaLink href={SECURITY_MAILTO} variant="outline">
              Report a Security Concern
            </ContactCtaLink>
            <Link
              href={SECURITY_HREF}
              className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Security overview
            </Link>
          </div>
        </div>
      </div>
    </MarketingDocPage>
  );
}
