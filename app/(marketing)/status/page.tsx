import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { CONTACT_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Manually reviewed Private Alpha system status for Chasum core services. Automated incident history is Coming Next.",
};

const LAST_REVIEWED = "2026-07-24";

const SERVICES = [
  {
    name: "Application and dashboard",
    status: "Operational",
  },
  {
    name: "Public booking",
    status: "Operational",
  },
  {
    name: "Database and authentication",
    status: "Operational",
  },
  {
    name: "Email delivery",
    status: "Configuration dependent",
  },
  {
    name: "SMS delivery",
    status: "Configuration dependent",
  },
  {
    name: "Payment integrations",
    status: "Configuration dependent",
  },
] as const;

export default function StatusPage() {
  return (
    <MarketingDocPage
      eyebrow="Operations"
      title="Private Alpha system status"
      description="This page reports the latest manually reviewed status of Chasum’s core services. Automated incident history and monitoring are Coming Next."
    >
      <p className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Last reviewed: {LAST_REVIEWED}
      </p>

      <ul className="space-y-3">
        {SERVICES.map((service) => (
          <li
            key={service.name}
            className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium text-foreground">{service.name}</span>
            <span className="text-sm text-muted-foreground">
              {service.status}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Status values used here: Operational, Configuration dependent, Limited,
        Unavailable, and Maintenance. Email, SMS, and payment integrations
        depend on provider credentials for each environment.
      </p>

      <p className="text-sm text-muted-foreground">
        For an issue affecting your business,{" "}
        <Link href={`${CONTACT_HREF}#support`} className="text-primary hover:underline">
          contact support
        </Link>{" "}
        or email sales@chasum.app.
      </p>
    </MarketingDocPage>
  );
}
