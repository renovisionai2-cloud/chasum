import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { CONTACT_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Chasum privacy policy for Private Alpha and design partners.",
};

export default function PrivacyPage() {
  return (
    <MarketingDocPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="Last updated July 18, 2026. This Private Alpha policy explains how Chasum handles information while we work with a limited number of design partners."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Who we are</h2>
        <p className="text-muted-foreground">
          Chasum provides scheduling, CRM, and AI-assisted operations software for
          service businesses. Contact:{" "}
          <Link href={CONTACT_HREF} className="text-primary hover:underline">
            Contact
          </Link>{" "}
          or sales@chasum.app.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Information we collect</h2>
        <p className="text-muted-foreground">
          Account details (name, email), business configuration, appointment and
          customer data you enter, application form submissions, and technical
          logs needed to operate and secure the service.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How we use information</h2>
        <p className="text-muted-foreground">
          To provide the product, send transactional messages you configure,
          improve reliability, and communicate with design partners about the
          Private Alpha. We do not sell personal data.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Processors</h2>
        <p className="text-muted-foreground">
          Infrastructure and messaging may include Supabase (database/auth),
          Vercel (hosting), Resend (email), Twilio (SMS, when enabled), and Stripe
          (payments, when enabled). Card numbers are never stored by Chasum.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Retention and your rights</h2>
        <p className="text-muted-foreground">
          Design partners may request export or deletion of their tenant data by
          contacting sales@chasum.app. We retain operational logs as needed for
          security and debugging.
        </p>
      </section>
      <p className="text-sm text-muted-foreground">
        This is a Private Alpha policy and will be updated before open paid
        self-serve launch. For questions, use the contact page.
      </p>
    </MarketingDocPage>
  );
}
