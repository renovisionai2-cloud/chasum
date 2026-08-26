import { Button } from "@/components/ui/button";
import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  DEMO_MAILTO_FALLBACK,
  SECURITY_HREF,
} from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Apply for Private Alpha, book a product walkthrough, reach support, or report a security concern.",
};

const SUPPORT_MAILTO =
  "mailto:sales@chasumai.com?subject=Chasum%20Design%20Partner%20Support";
const SECURITY_MAILTO =
  "mailto:sales@chasumai.com?subject=Chasum%20Security%20Concern";

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
          <Link href={APPLY_HREF} className="mt-4 inline-block">
            <Button className="rounded-full">{CTA_APPLY_LABEL}</Button>
          </Link>
        </div>

        <div
          id="walkthrough"
          className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/60 p-5"
        >
          <h2 className="font-semibold text-foreground">Product Walkthrough</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For operators who want to understand the platform before applying.
          </p>
          <a href={DEMO_MAILTO_FALLBACK} className="mt-4 inline-block">
            <Button variant="outline" className="rounded-full">
              {CTA_DEMO_LABEL}
            </Button>
          </a>
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
          <a href={SUPPORT_MAILTO} className="mt-4 inline-block">
            <Button variant="outline" className="rounded-full">
              Contact Support
            </Button>
          </a>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
          <h2 className="font-semibold text-foreground">Security Concern</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For responsible reporting of a potential security issue.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={SECURITY_MAILTO}>
              <Button variant="outline" className="rounded-full">
                Report a Security Concern
              </Button>
            </a>
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
