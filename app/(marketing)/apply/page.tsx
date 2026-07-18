import { DesignPartnerForm } from "@/components/landing/design-partner-form";
import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { PRIVATE_ALPHA_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apply for Private Alpha",
  description:
    "Apply to become a Chasum design partner. Limited seats, founder access, and early access to Summer and Chase.",
};

export default function ApplyPage() {
  return (
    <MarketingDocPage
      eyebrow="Design partners"
      title="Apply for Private Alpha"
      description="We work closely with a limited number of service businesses. Tell us about your operation — we review every application personally."
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
