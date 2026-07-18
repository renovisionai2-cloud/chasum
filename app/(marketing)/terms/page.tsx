import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { APPLY_HREF, CONTACT_HREF, PRIVACY_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Chasum terms for Private Alpha and design partner access.",
};

export default function TermsPage() {
  return (
    <MarketingDocPage
      eyebrow="Legal"
      title="Terms of Service"
      description="Last updated July 18, 2026. These terms apply to Private Alpha access and design partner use of Chasum."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Private Alpha</h2>
        <p className="text-muted-foreground">
          Chasum is offered to a limited number of design partners. Features
          labeled Early Access may change. Availability is not guaranteed for
          production-critical workloads without a written design-partner
          agreement.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Accounts</h2>
        <p className="text-muted-foreground">
          You are responsible for credentials, lawful use of customer data you
          upload, and compliance with applicable privacy laws for your clients.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Acceptable use</h2>
        <p className="text-muted-foreground">
          Do not abuse APIs, scrape availability, attempt unauthorized access, or
          use Chasum to send spam. We may suspend access that threatens platform
          stability or other customers.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Fees</h2>
        <p className="text-muted-foreground">
          During Private Alpha, access may be complimentary or covered by a
          separate founding-customer agreement. Public self-serve pricing is not
          yet checkout-enabled. See{" "}
          <Link href={APPLY_HREF} className="text-primary hover:underline">
            Apply for Private Alpha
          </Link>
          .
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Disclaimer</h2>
        <p className="text-muted-foreground">
          The service is provided “as is” during alpha. We work to keep booking
          reliable, but Private Alpha does not include enterprise SLAs unless
          separately agreed in writing.
        </p>
      </section>
      <p className="text-sm text-muted-foreground">
        Privacy practices are described in our{" "}
        <Link href={PRIVACY_HREF} className="text-primary hover:underline">
          Privacy Policy
        </Link>
        . Questions:{" "}
        <Link href={CONTACT_HREF} className="text-primary hover:underline">
          Contact
        </Link>
        .
      </p>
    </MarketingDocPage>
  );
}
