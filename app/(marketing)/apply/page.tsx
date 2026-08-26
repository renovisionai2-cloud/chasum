import { DesignPartnerForm } from "@/components/landing/design-partner-form";
import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { PRIVATE_ALPHA_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apply for Private Alpha",
  description:
    "Apply to help shape Chasum—the AI Business Operating System for service businesses. We review every Private Alpha application personally.",
};

export default function ApplyPage() {
  return (
    <MarketingDocPage
      eyebrow="Design partners"
      title="Tell us how your business works."
      description="We review every application personally. Share how you want one connected operating system—not another disconnected scheduler—to fit the workflows you run today."
    >
      <p className="text-sm text-muted-foreground">
        Prefer context first? Read{" "}
        <Link href={PRIVATE_ALPHA_HREF} className="text-primary hover:underline">
          Why Private Alpha?
        </Link>
      </p>
      <DesignPartnerForm />
    </MarketingDocPage>
  );
}
