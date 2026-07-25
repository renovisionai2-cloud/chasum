import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { CONTACT_HREF, STATUS_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Safeguards implemented today during Private Alpha—authentication, tenant isolation, encryption through providers, and current limitations. No unverified certifications.",
};

export default function SecurityPage() {
  return (
    <MarketingDocPage
      eyebrow="Trust"
      title="Security built into the operating foundation."
      description="Chasum is in Private Alpha. We describe the safeguards implemented today, identify configuration dependencies, and avoid claiming certifications or guarantees we have not earned."
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
          Each business operates in its own protected workspace, supported by
          tenant-level access controls in the database. Design partners work in
          their own business workspace.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Encryption in transit and at rest
        </h2>
        <p className="text-muted-foreground">
          Traffic uses HTTPS. Data at rest and provider encryption depend on
          Supabase and other configured infrastructure providers. We do not
          claim independent cryptographic certifications beyond what those
          providers document.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Access control</h2>
        <p className="text-muted-foreground">
          Dashboard access is gated to authenticated owners today. Multi-staff
          login with enforced role-based invitations is Coming Next.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Audit and activity logging</h2>
        <p className="text-muted-foreground">
          Operational activity is recorded in product timelines and application
          logs used for support and debugging. Formal compliance-grade audit
          exports are not claimed during Private Alpha.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Secrets and environment separation
        </h2>
        <p className="text-muted-foreground">
          API keys and provider credentials are stored as environment secrets,
          not in client bundles. Environments are separated by deployment
          configuration.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Backups and recovery</h2>
        <p className="text-muted-foreground">
          Database backups follow the configured Supabase project settings.
          Recovery objectives for design partners are confirmed during
          onboarding when required—not as a public SLA.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Provider security</h2>
        <p className="text-muted-foreground">
          Chasum relies on providers such as Supabase, Resend, Twilio, and
          Stripe (when enabled). Card numbers are not stored by Chasum; Stripe
          handles card data when that path is configured. Manual payment
          recording covers cash and e-transfer workflows during alpha.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Incident reporting</h2>
        <p className="text-muted-foreground">
          Check{" "}
          <Link href={STATUS_HREF} className="text-primary hover:underline">
            Status
          </Link>{" "}
          for manually reviewed service notes. Report security concerns via{" "}
          <Link href={CONTACT_HREF} className="text-primary hover:underline">
            Contact
          </Link>{" "}
          or email sales@chasum.app with subject “Security”.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Current limitations</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Private Alpha is not a finished enterprise security program.</li>
          <li>
            Messaging, SMS, and payment providers are configuration-dependent.
          </li>
          <li>
            Automated public status history and formal SLAs are Coming Next.
          </li>
          <li>
            Production-critical guarantees require a separate written agreement.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Compliance status</h2>
        <p className="text-muted-foreground">
          We do not claim HIPAA, PIPEDA, PHIPA, SOC 2, ISO 27001, or any other
          certification or regulated compliance status without formal legal and
          security verification. Healthcare customers must assess regulatory
          requirements separately. Chasum is business operations software—not an
          electronic medical record.
        </p>
      </section>
    </MarketingDocPage>
  );
}
