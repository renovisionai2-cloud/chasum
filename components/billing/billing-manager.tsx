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
import { AlertMessage } from "@/components/ui/form-feedback";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  cancelSubscriptionAction,
  changeSubscriptionPlan,
  getInvoiceDownload,
  reactivateSubscriptionAction,
} from "@/lib/actions/billing";
import { formatPlanPrice, PLAN_RANK } from "@/lib/billing/catalog";
import type { BillingSummary } from "@/lib/billing/types";
import { APPLY_HREF } from "@/lib/marketing/alpha";
import {
  ENTERPRISE_SALES_MESSAGE,
  PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE,
  showSubscriptionLifecycleControls,
} from "@/lib/billing/paid-upgrade-guard";
import { formatUsdFromCents } from "@/lib/owner/constants";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { Download, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useActionState, useState, useTransition } from "react";

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function BillingManager({ summary }: { summary: BillingSummary }) {
  const { toast } = useToast();
  const { subscription, plans, invoices, events } = summary;
  const [interval, setInterval] = useState(subscription.billingInterval);
  const [changeState, changeAction, changePending] = useActionState(
    changeSubscriptionPlan,
    {} as ActionState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelSubscriptionAction,
    {} as ActionState,
  );
  const [reactivatePending, startReactivate] = useTransition();
  const [downloadPending, startDownload] = useTransition();

  useFormAction(changeState);
  useFormAction(cancelState);

  const upgradePlans = plans.filter(
    (plan) => PLAN_RANK[plan.planKey] > PLAN_RANK[subscription.planKey],
  );
  const downgradePlans = plans.filter(
    (plan) =>
      PLAN_RANK[plan.planKey] < PLAN_RANK[subscription.planKey] &&
      plan.planKey !== "enterprise",
  );

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
            Your current Chasum plan. Paid self-serve checkout is not connected
            in this environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-semibold tracking-tight">
              {subscription.planName}
            </p>
            <Badge className="capitalize">
              {statusLabel(subscription.status)}
            </Badge>
            {subscription.cancelAtPeriodEnd ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Cancels at period end
              </Badge>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Billing</dt>
              <dd className="font-medium capitalize">
                {subscription.billingInterval}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Trial status</dt>
              <dd className="font-medium">
                {subscription.status === "trialing"
                  ? "On trial"
                  : subscription.trialEndsAt
                    ? "Trial ended"
                    : "Not on trial"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Trial days remaining</dt>
              <dd className="font-medium">
                {subscription.trialDaysRemaining === null
                  ? "—"
                  : `${subscription.trialDaysRemaining} day${subscription.trialDaysRemaining === 1 ? "" : "s"}`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Renewal date</dt>
              <dd className="font-medium">
                {subscription.currentPeriodEnd
                  ? format(
                      new Date(subscription.currentPeriodEnd),
                      "MMM d, yyyy",
                    )
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Period start</dt>
              <dd className="font-medium">
                {subscription.currentPeriodStart
                  ? format(
                      new Date(subscription.currentPeriodStart),
                      "MMM d, yyyy",
                    )
                  : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upgrade</CardTitle>
            <CardDescription>
              {summary.paidSelfServeCheckoutAvailable
                ? "Move to a higher plan. Enterprise requires Contact Sales."
                : PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.paidSelfServeCheckoutAvailable ? (
            <form action={changeAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="upgrade_interval">Billing interval</Label>
                <Select
                  id="upgrade_interval"
                  name="billing_interval"
                  value={interval}
                  onChange={(e) =>
                    setInterval(e.target.value === "yearly" ? "yearly" : "monthly")
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="upgrade_plan">Plan</Label>
                <Select id="upgrade_plan" name="plan_key" required defaultValue="">
                  <option value="" disabled>
                    Select plan…
                  </option>
                  {upgradePlans.map((plan) => (
                    <option key={plan.planKey} value={plan.planKey}>
                      {plan.name} · {formatPlanPrice(plan, interval)}
                    </option>
                  ))}
                </Select>
              </div>
              <AlertMessage error={changeState.error} success={changeState.success} />
              <Button
                type="submit"
                disabled={changePending || upgradePlans.length === 0}
              >
                {changePending ? "Updating…" : "Upgrade"}
              </Button>
              {upgradePlans.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You are already on the highest self-serve plan.
                </p>
              ) : null}
            </form>
            ) : (
              <div className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {upgradePlans
                    .filter((plan) => plan.planKey !== "enterprise")
                    .map((plan) => (
                      <li key={plan.planKey}>
                        <span className="font-medium text-foreground">
                          {plan.name}
                        </span>
                        {" · "}
                        {formatPlanPrice(plan, interval)}
                        {" · Coming soon"}
                      </li>
                    ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  {ENTERPRISE_SALES_MESSAGE}
                </p>
                <Button type="button" variant="outline" disabled>
                  Upgrade unavailable
                </Button>
                <p className="text-xs text-muted-foreground">
                  <a
                    href={APPLY_HREF}
                    className="font-medium text-primary hover:underline"
                  >
                    Apply for Private Alpha
                  </a>{" "}
                  if you need a higher plan before self-serve checkout opens.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Downgrade</CardTitle>
            <CardDescription>
              Move to a lower plan. This does not collect payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={changeAction} className="space-y-3">
              <input type="hidden" name="billing_interval" value={interval} />
              <div className="space-y-2">
                <Label htmlFor="downgrade_plan">Plan</Label>
                <Select
                  id="downgrade_plan"
                  name="plan_key"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select plan…
                  </option>
                  {downgradePlans.map((plan) => (
                    <option key={plan.planKey} value={plan.planKey}>
                      {plan.name} · {formatPlanPrice(plan, interval)}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={changePending || downgradePlans.length === 0}
              >
                {changePending ? "Updating…" : "Downgrade"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {showSubscriptionLifecycleControls(subscription) ? (
      <Card>
        <CardHeader>
          <CardTitle>Cancel subscription</CardTitle>
          <CardDescription>
            Schedule cancellation at period end, or cancel immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscription.status === "canceled" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This subscription is canceled
                {subscription.canceledAt
                  ? ` as of ${format(new Date(subscription.canceledAt), "MMM d, yyyy")}`
                  : ""}
                .
              </p>
              <Button
                type="button"
                disabled={reactivatePending}
                onClick={() =>
                  startReactivate(async () => {
                    const result = await reactivateSubscriptionAction();
                    if (result.error) toast(result.error, "error");
                    else toast(result.success ?? "Reactivated.", "success");
                  })
                }
              >
                {reactivatePending ? "Reactivating…" : "Reactivate"}
              </Button>
            </div>
          ) : (
            <form action={cancelAction} className="flex flex-wrap gap-2">
              <Button
                type="submit"
                name="immediately"
                value="false"
                variant="outline"
                disabled={cancelPending || subscription.cancelAtPeriodEnd}
              >
                Cancel at period end
              </Button>
              <Button
                type="submit"
                name="immediately"
                value="true"
                variant="destructive"
                disabled={cancelPending}
              >
                Cancel immediately
              </Button>
              <AlertMessage error={cancelState.error} success={cancelState.success} />
            </form>
          )}
        </CardContent>
      </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Billing history</CardTitle>
          <CardDescription>
            Plan changes and payment events for this business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState
              variant="inline"
              title="No billing history yet"
              description="Upgrades, downgrades, and cancellations will appear here."
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
            Download invoices. Stripe-hosted PDF links will appear when Stripe is connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState
              variant="inline"
              glyph={Receipt}
              title="No invoices yet"
              description="Invoices appear when a real payment is collected. Simulated upgrades do not create invoices."
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
    </div>
  );
}
