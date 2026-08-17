import { InvoiceWorkspaceActions } from "@/components/commerce/invoice-workspace-actions";
import type { InvoiceWorkspaceModel } from "@/lib/commerce/document-workspace";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function InvoiceDocument({ model }: { model: InvoiceWorkspaceModel }) {
  const inv = model.invoice;
  return (
    <article className="commerce-print-sheet mx-auto max-w-3xl bg-white text-neutral-900">
      <header className="flex flex-col gap-6 border-b border-neutral-200 pb-6 sm:flex-row sm:justify-between print:gap-3 print:pb-3">
        <div className="space-y-2 print:space-y-1">
          {model.businessLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={model.businessLogoUrl}
              alt=""
              className="h-12 w-auto max-w-[12rem] object-contain print:h-9"
            />
          ) : null}
          <p className="text-lg font-semibold tracking-tight">{model.businessName}</p>
          {model.businessLegalName && model.businessLegalName !== model.businessName ? (
            <p className="text-sm text-neutral-600">{model.businessLegalName}</p>
          ) : null}
          {model.businessAddress ? (
            <p className="text-sm text-neutral-600">{model.businessAddress}</p>
          ) : null}
          <p className="text-sm text-neutral-600">
            {[model.businessEmail, model.businessPhone].filter(Boolean).join(" · ")}
          </p>
          {model.taxNumber ? (
            <p className="text-xs text-neutral-500">Tax {model.taxNumber}</p>
          ) : null}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
            Invoice
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{model.invoiceNumber}</h1>
          <p className="mt-2 text-sm font-medium">{model.statusLabel}</p>
          <p className="mt-1 text-sm text-neutral-600">Issued {model.issueDateLabel}</p>
          {model.dueDateLabel ? (
            <p className="text-sm text-neutral-600">Due {model.dueDateLabel}</p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-neutral-700">
            Currency {model.currencyCode}
          </p>
        </div>
      </header>

      {model.currencyMismatch ? (
        <p className="print:hidden mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Stored document currency is {model.currencyCode}. This business operates in{" "}
          {model.businessCurrency.toUpperCase()}. Amounts are exact ledger cents. Historical
          currency codes were not rewritten.
        </p>
      ) : null}

      <section className="mt-6 grid gap-6 sm:grid-cols-2 print:mt-4 print:gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Bill to
          </p>
          <p className="mt-1 font-medium">{model.customerName}</p>
          {model.customerEmail ? (
            <p className="text-sm text-neutral-600">{model.customerEmail}</p>
          ) : null}
          {model.customerPhone ? (
            <p className="text-sm text-neutral-600">{model.customerPhone}</p>
          ) : null}
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

      <table className="mt-8 w-full text-sm print:mt-4">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-500">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {model.displayLines.map((line) => (
            <tr key={line.key} className="border-b border-neutral-100">
              <td className="py-3 print:py-2">{line.description}</td>
              <td className="py-3 text-right tabular-nums print:py-2">{line.quantity}</td>
              <td className="py-3 text-right tabular-nums print:py-2">{line.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="commerce-print-keep">
        <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm print:mt-4">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Subtotal</dt>
            <dd className="tabular-nums">{model.money.subtotal}</dd>
          </div>
          {inv.discountCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-neutral-600">Discount</dt>
              <dd className="tabular-nums">−{model.money.discount}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-neutral-600">Tax</dt>
            <dd className="tabular-nums">{model.money.tax}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
            <dt>Invoice total</dt>
            <dd className="tabular-nums">{model.money.total}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">Paid</dt>
            <dd className="tabular-nums">{model.money.paid}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">Refunded</dt>
            <dd className="tabular-nums">{model.money.refunded}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Balance</dt>
            <dd className="tabular-nums">{model.money.balance}</dd>
          </div>
        </dl>

        {model.notes ? (
          <p className="mt-6 text-sm text-neutral-600 print:mt-3">{model.notes}</p>
        ) : null}

        <section className="commerce-print-payments mt-8 border-t border-neutral-200 pt-5 print:mt-4 print:pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Payments
          </p>
          {model.payments.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">No payments recorded on this invoice.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {model.payments.map((p) => (
                <li key={`${p.label}-${p.when}`} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {p.label} · {p.method} · {p.when}
                    {p.receiptHref && p.receiptNumber ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link className="print:hidden underline" href={p.receiptHref}>
                          {p.receiptNumber}
                        </Link>
                        <span className="hidden print:inline">{p.receiptNumber}</span>
                      </>
                    ) : null}
                  </span>
                  <span className="tabular-nums">{p.amount}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="print:hidden mt-3 text-xs text-neutral-500">
            Email:{" "}
            {model.emailStatus === "sent"
              ? "Sent"
              : model.emailStatus === "failed"
                ? "Failed"
                : model.emailStatus === "no_recipient"
                  ? "No recipient"
                  : "Never sent"}
            {model.emailDetail ? ` · ${model.emailDetail}` : ""}
          </p>
        </section>
      </div>

      <div className="mt-8 print:hidden">
        <InvoiceWorkspaceActions
          invoiceNumber={model.invoiceNumber}
          customerHref={model.customerHref}
          appointmentHref={model.appointmentHref}
          collectHref={model.collectHref}
          emailStatus={model.emailStatus}
          canEmail={Boolean(model.customerEmail)}
        />
      </div>
    </article>
  );
}

export function InvoiceDocumentPage({
  model,
  className,
}: {
  model: InvoiceWorkspaceModel;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 print:space-y-0", className)}>
      <InvoiceDocument model={model} />
    </div>
  );
}
