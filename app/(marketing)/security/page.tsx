import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { CONTACT_HREF, STATUS_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Chasum approaches security during Private Alpha — authentication, tenant isolation, and payments.",
};

export default function SecurityPage() {
  return (
    <MarketingDocPage
      eyebrow="Trust"
      title="Security"
      description="Practical security posture for Private Alpha. We do not claim “enterprise complete” compliance theater — here is what is real today."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Authentication</h2>
        <p className="text-muted-foreground">
          Owner access uses Supabase Auth with session cookies. Protected
          dashboard routes require a signed-in user.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Tenant isolation</h2>
        <p className="text-muted-foreground">
          Business data is scoped by tenant identifiers with row-level security
          policies in Supabase. Design partners operate in their own business
          workspace.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Payments</h2>
        <p className="text-muted-foreground">
          Chasum does not store card numbers. When Stripe is enabled, card data
          is handled by Stripe. Manual payment recording is available for cash
          and e-transfer workflows during alpha.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Abuse controls</h2>
        <p className="text-muted-foreground">
          Public booking and API surfaces include rate limiting. Inbound
          provider webhooks verify signatures when configured.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Status and incidents</h2>
        <p className="text-muted-foreground">
          Check{" "}
          <Link href={STATUS_HREF} className="text-primary hover:underline">
            Status
          </Link>{" "}
          for current notes. Report security concerns via{" "}
          <Link href={CONTACT_HREF} className="text-primary hover:underline">
            Contact
          </Link>{" "}
          or sales@chasum.app with subject “Security”.
        </p>
      </section>
    </MarketingDocPage>
  );
}
