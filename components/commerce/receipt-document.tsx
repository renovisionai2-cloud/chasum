import { ReceiptWorkspaceActions } from "@/components/commerce/receipt-workspace-actions";
import type { ReceiptWorkspaceModel } from "@/lib/commerce/document-workspace";

export function ReceiptDocument({ model }: { model: ReceiptWorkspaceModel }) {
  return (
    <article className="commerce-print-sheet mx-auto max-w-3xl bg-white text-neutral-900">
      <header className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Payment receipt
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{model.receiptNumber}</h1>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{model.thisPayment}</p>
        <p className="mt-1 text-sm text-neutral-600">
          {model.kindLabel} · {model.methodLabel}
        </p>
        <p className="text-sm text-neutral-600">{model.paidAt}</p>
        <p className="mt-1 text-xs font-medium text-neutral-700">Currency {model.currencyCode}</p>
      </header>

      {model.currencyMismatch ? (
        <p className="print:hidden mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Stored receipt currency is {model.currencyCode}. This business operates in{" "}
          {model.businessCurrency.toUpperCase()}. Amounts are exact ledger cents. Historical
          currency codes were not rewritten.
        </p>
      ) : null}

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Customer
          </p>
          <p className="mt-1 font-medium">{model.customerName}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Appointment
          </p>
          <p className="mt-1 font-medium">{model.serviceName ?? "Service"}</p>
          {model.appointmentWhen ? (
            <p className="text-sm text-neutral-600">{model.appointmentWhen}</p>
          ) : null}
          {model.locationName ? (
            <p className="text-sm text-neutral-600">{model.locationName}</p>
          ) : null}
          {model.staffName ? (
            <p className="text-sm text-neutral-600">{model.staffName}</p>
          ) : null}
        </div>
      </section>

      <dl className="mt-8 space-y-2 text-sm">
        {model.appointmentSubtotal ? (
          <div className="flex justify-between">
            <dt className="text-neutral-600">Appointment subtotal</dt>
            <dd className="tabular-nums">{model.appointmentSubtotal}</dd>
          </div>
        ) : null}
        {model.appointmentTax ? (
          <div className="flex justify-between">
            <dt className="text-neutral-600">Tax</dt>
            <dd className="tabular-nums">{model.appointmentTax}</dd>
          </div>
        ) : null}
        {model.appointmentTotal ? (
          <div className="flex justify-between">
            <dt className="text-neutral-600">Appointment total</dt>
            <dd className="tabular-nums">{model.appointmentTotal}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
          <dt>This payment</dt>
          <dd className="tabular-nums">{model.thisPayment}</dd>
        </div>
        {model.totalPaidAfter ? (
          <div className="flex justify-between">
            <dt className="text-neutral-600">Total paid after this payment</dt>
            <dd className="tabular-nums">{model.totalPaidAfter}</dd>
          </div>
        ) : null}
        {model.balanceAfter ? (
          <div className="flex justify-between">
            <dt className="text-neutral-600">Balance after this payment</dt>
            <dd className="tabular-nums">{model.balanceAfter}</dd>
          </div>
        ) : null}
      </dl>

      {model.invoiceNumber ? (
        <p className="mt-6 text-sm text-neutral-600">
          Invoice {model.invoiceNumber}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-neutral-500">Email {model.emailStatus}</p>

      <div className="mt-8">
        <ReceiptWorkspaceActions
          receiptNumber={model.receiptNumber}
          customerHref={model.customerHref}
          appointmentHref={model.appointmentHref}
          invoiceHref={model.invoiceHref}
          refundHref={model.refundHref}
        />
      </div>
    </article>
  );
}
