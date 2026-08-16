import { ReceiptDocument } from "@/components/commerce/receipt-document";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { loadReceiptWorkspace } from "@/lib/commerce/document-workspace";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return { title: `${decodeURIComponent(number)} · Receipt` };
}

export default async function ReceiptWorkspacePage({ params }: Props) {
  const business = await getOrCreateBusiness();
  const { number } = await params;
  const model = await loadReceiptWorkspace({
    businessId: business.id,
    receiptNumber: number,
  });
  if (!model) notFound();

  return (
    <div className="ds-page space-y-6">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Payments"
          title={model.receiptNumber}
          description="Receipt for a single succeeded payment — not the full invoice."
        >
          <Link
            href="/dashboard/payments"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to Payments
          </Link>
        </PageHeader>
      </div>
      <ReceiptDocument model={model} />
    </div>
  );
}
