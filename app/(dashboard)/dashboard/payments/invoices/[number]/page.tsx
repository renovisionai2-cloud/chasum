import { InvoiceDocumentPage } from "@/components/commerce/invoice-document";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { loadInvoiceWorkspace } from "@/lib/commerce/document-workspace";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return { title: `${decodeURIComponent(number)} · Invoice` };
}

export default async function InvoiceWorkspacePage({ params }: Props) {
  const business = await getOrCreateBusiness();
  const { number } = await params;
  const model = await loadInvoiceWorkspace({
    businessId: business.id,
    invoiceNumber: number,
  });
  if (!model) notFound();

  return (
    <div className="ds-page space-y-6 print:space-y-0">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Payments"
          title={model.invoiceNumber}
          description="Professional invoice document from the customer commerce ledger."
        >
          <Link
            href="/dashboard/payments"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to Payments
          </Link>
        </PageHeader>
      </div>
      <InvoiceDocumentPage model={model} />
    </div>
  );
}
