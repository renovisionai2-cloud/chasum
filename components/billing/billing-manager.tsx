"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { getInvoiceDownload } from "@/lib/actions/billing";
import {
  PRIVATE_ALPHA_BILLING_ARRANGEMENT,
  PRIVATE_ALPHA_PLAN_REQUEST_CTA,
  PRIVATE_ALPHA_PLAN_REQUEST_HREF,
  privateAlphaStatusLabel,
} from "@/lib/billing/private-alpha-plan";
import type { BillingSummary } from "@/lib/billing/types";
import { APPLY_HREF, CTA_APPLY_LABEL } from "@/lib/marketing/alpha";
import { formatUsdFromCents } from "@/lib/owner/constants";
import { useToast } from "@/providers/toast-provider";
import { Download, Receipt } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useTransition } from "react";

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function BillingManager({ summary }: { summary: BillingSummary }) {
  const { toast } = useToast();
  const { subscription, invoices, events } = summary;
  const [downloadPending, startDownload] = useTransition();
  const selfServeLocked = !summary.paidSelfServeCheckoutAvailable;

  function downloadInvoice(invoiceId: string) {
    startDownload(async () => {
      const result = await getInvoiceDownload(invoiceId);
      if ("error" in result && result.error) {
        toast(result.error, "error");
        return;
      }
      if ("url" in result && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        return;
      }
      if ("body" in result && result.body && result.filename) {
        const blob = new Blob([result.body], {
          type: result.contentType ?? "text/plain",
        });
        const href = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = result.filename;
        anchor.click();
        URL.revokeObjectURL(href);
        toast("Invoice downloaded.", "success");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {selfServeLocked
              ? PRIVATE_ALPHA_BILLING_ARRANGEMENT
              : "Your Chasum product plan and billing arrangement."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">
              {subscription.planName}
            </p>
            <Badge className="capitalize">
              {statusLabel(subscription.status)}
            </Badge>
            {summary.privateAlphaEnabled ? (
              <Badge className="bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
                Private Alpha
              </Badge>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Product plan</dt>
              <dd className="font-medium">{subscription.planName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Private Alpha access</dt>
              <dd className="font-medium">
                {privateAlphaStatusLabel(summary.privateAlphaEnabled)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Billing arrangement</dt>
              <dd className="font-medium">
                {selfServeLocked
                  ? "Arranged with Chasum — not self-serve"
                  : "Self-serve subscription"}
              </dd>
            </div>
            {subscription.currentPeriodEnd ? (
              <div>
                <dt className="text-muted-foreground">Current period end</dt>
                <dd className="font-medium">
                  {format(
                    new Date(subscription.currentPeriodEnd),
                    "MMM d, yyyy",
                  )}
                </dd>
              </div>
            ) : null}
          </dl>

          {selfServeLocked ? (
            <div className="rounded-[var(--radius-md)] border border-border bg-muted/30 px-4 py-3 space-y-3">
              <p className="text-sm text-foreground">
                Need a different plan? Request it through Private Alpha. Chasum
                confirms the arrangement with you — there is no checkout on this
                page.
              </p>
              <Link href={PRIVATE_ALPHA_PLAN_REQUEST_HREF}>
                <Button type="button">{PRIVATE_ALPHA_PLAN_REQUEST_CTA}</Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Self-serve plan changes use your billing provider.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan history</CardTitle>
          <CardDescription>
            Recorded product-plan changes for this business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState
              variant="inline"
              title="No plan changes yet"
              description="Approved plan assignments will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <span className="font-medium capitalize">
                    {event.eventType.replace(/_/g, " ")}
                    {event.toPlanKey ? ` → ${event.toPlanKey}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.createdAt), "MMM d, yyyy · h:mm a")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Invoices appear when a payment is actually recorded. Assigned
            Private Alpha plans do not create invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState
              variant="inline"
              glyph={Receipt}
              title="No invoices yet"
              description="Chasum does not generate invoices for mock or manually assigned plans."
            />
          ) : (
            <ul className="divide-y divide-border">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.description ?? invoice.planKey} ·{" "}
                      {formatUsdFromCents(invoice.amountCents)} ·{" "}
                      {invoice.status}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={downloadPending}
                    onClick={() => downloadInvoice(invoice.id)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {selfServeLocked ? (
        <p className="text-xs text-muted-foreground">
          <Link
            href={APPLY_HREF}
            className="font-medium text-primary hover:underline"
          >
            {CTA_APPLY_LABEL}
          </Link>{" "}
          if you are not yet a design partner.
        </p>
      ) : null}
    </div>
  );
}
