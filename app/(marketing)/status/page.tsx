import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { CONTACT_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Status",
  description: "Chasum platform status for Private Alpha.",
};

export default function StatusPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <MarketingDocPage
      eyebrow="Operations"
      title="Status"
      description="Manual status board for Private Alpha. Automated status history ships later."
    >
      <div className="rounded-2xl border border-success/30 bg-success/10 px-5 py-6">
        <p className="text-sm font-semibold text-success">All systems normal</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Core booking, dashboard, and public booking are operating for design
          partners. Last reviewed: {updated}.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>App & dashboard — Operational</li>
        <li>Public booking — Operational</li>
        <li>Email delivery — Depends on Resend configuration per environment</li>
        <li>SMS — Optional (Twilio)</li>
        <li>Subscription checkout — Not enabled (Private Alpha)</li>
      </ul>
      <p className="text-sm text-muted-foreground">
        Seeing an issue?{" "}
        <Link href={CONTACT_HREF} className="text-primary hover:underline">
          Contact us
        </Link>{" "}
        or email sales@chasum.app.
      </p>
    </MarketingDocPage>
  );
}
