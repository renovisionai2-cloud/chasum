import { BillingManager } from "@/components/billing/billing-manager";
import { PageHeader } from "@/components/ui/page-header";
import { loadBusinessBilling } from "@/lib/actions/billing";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function BillingSettingsPage() {
  const summary = await loadBusinessBilling();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Your Chasum plan, trial, invoices, and subscription controls."
      >
        <Link
          href="/dashboard/settings"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Settings
        </Link>
      </PageHeader>
      <BillingManager summary={summary} />
    </div>
  );
}
