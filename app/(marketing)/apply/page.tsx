import { DesignPartnerForm } from "@/components/landing/design-partner-form";
import { MarketingDocPage } from "@/components/landing/marketing-doc-page";
import { PRIVATE_ALPHA_HREF } from "@/lib/marketing/alpha";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apply for Private Alpha",
  description:
    "Tell us how your business works. We review every Private Alpha application personally.",
};

export default function ApplyPage() {
  return (
    <MarketingDocPage
      eyebrow="Design partners"
      title="Tell us how your business works."
      description="We review every application personally. Share the workflows you want to improve, the tools you use today and what a successful partnership with Chasum would look like."
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
