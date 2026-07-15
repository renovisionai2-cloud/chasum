import {
  addBillingPeriod,
  comparePlans,
  FALLBACK_PLANS,
  isPlanKey,
  planPriceCents,
  trialDaysRemaining,
} from "@/lib/billing/catalog";
import type {
  BillingInterval,
  BillingInvoice,
  BillingPlan,
  BillingProvider,
  BillingSummary,
  BillingSubscription,
  PlanKey,
  SubscriptionEvent,
  SubscriptionStatus,
} from "@/lib/billing/types";
import { createClient } from "@/lib/supabase/server";

function asStatus(value: unknown): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "paused",
  ];
  if (typeof value === "string" && allowed.includes(value as SubscriptionStatus)) {
    return value as SubscriptionStatus;
  }
  return "active";
}

function asInterval(value: unknown): BillingInterval {
  return value === "yearly" ? "yearly" : "monthly";
}

function asPlanKey(value: unknown): PlanKey {
  if (typeof value === "string" && isPlanKey(value)) return value;
  return "starter";
}

function mapPlan(row: Record<string, unknown>): BillingPlan {
  return {
    planKey: asPlanKey(row.plan_key),
    name: String(row.name ?? row.plan_key),
    description: (row.description as string) ?? null,
    maxLocations: (row.max_locations as number | null) ?? null,
    monthlyPriceCents: (row.monthly_price_cents as number | null) ?? null,
    yearlyPriceCents: (row.yearly_price_cents as number | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active ?? true),
  };
}

function mapInvoice(row: Record<string, unknown>): BillingInvoice {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    invoiceNumber: String(row.invoice_number),
    status: (row.status as BillingInvoice["status"]) ?? "paid",
    planKey: row.plan_key ? asPlanKey(row.plan_key) : null,
    billingInterval: asInterval(row.billing_interval),
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "usd"),
    description: (row.description as string) ?? null,
    periodStart: (row.period_start as string) ?? null,
    periodEnd: (row.period_end as string) ?? null,
    paidAt: (row.paid_at as string) ?? null,
    pdfUrl: (row.pdf_url as string) ?? null,
    stripeInvoiceId: (row.stripe_invoice_id as string) ?? null,
    stripeHostedInvoiceUrl: (row.stripe_hosted_invoice_url as string) ?? null,
    createdAt: String(row.created_at),
  };
}

function mapEvent(row: Record<string, unknown>): SubscriptionEvent {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    eventType: row.event_type as SubscriptionEvent["eventType"],
    fromPlanKey: row.from_plan_key ? asPlanKey(row.from_plan_key) : null,
    toPlanKey: row.to_plan_key ? asPlanKey(row.to_plan_key) : null,
    fromStatus: (row.from_status as string) ?? null,
    toStatus: (row.to_status as string) ?? null,
    amountCents: (row.amount_cents as number | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function listBillingPlans(): Promise<BillingPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return FALLBACK_PLANS;
  }

  return data.map((row) => mapPlan(row as Record<string, unknown>));
}

export async function getBillingSummary(
  businessId: string,
): Promise<BillingSummary> {
  const supabase = await createClient();
  const plans = await listBillingPlans();

  const { data: business, error } = await supabase
    .from("businesses")
    .select(
      "id, name, subscription_plan_key, subscription_status, billing_interval, trial_starts_at, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, canceled_at, stripe_customer_id, stripe_subscription_id",
    )
    .eq("id", businessId)
    .single();

  if (error || !business) {
    throw new Error(error?.message ?? "Business not found.");
  }

  const planKey = asPlanKey(business.subscription_plan_key);
  const plan = plans.find((p) => p.planKey === planKey) ?? FALLBACK_PLANS[0]!;

  const subscription: BillingSubscription = {
    businessId: business.id as string,
    businessName: String(business.name),
    planKey,
    planName: plan.name,
    status: asStatus(business.subscription_status),
    billingInterval: asInterval(business.billing_interval),
    trialStartsAt: (business.trial_starts_at as string) ?? null,
    trialEndsAt: (business.trial_ends_at as string) ?? null,
    trialDaysRemaining: trialDaysRemaining(
      (business.trial_ends_at as string) ?? null,
    ),
    currentPeriodStart: (business.current_period_start as string) ?? null,
    currentPeriodEnd: (business.current_period_end as string) ?? null,
    cancelAtPeriodEnd: Boolean(business.cancel_at_period_end),
    canceledAt: (business.canceled_at as string) ?? null,
    stripeCustomerId: (business.stripe_customer_id as string) ?? null,
    stripeSubscriptionId: (business.stripe_subscription_id as string) ?? null,
  };

  let invoices: BillingInvoice[] = [];
  let events: SubscriptionEvent[] = [];

  try {
    const { data: invoiceRows } = await supabase
      .from("billing_invoices")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    invoices = (invoiceRows ?? []).map((row) =>
      mapInvoice(row as Record<string, unknown>),
    );
  } catch {
    invoices = [];
  }

  try {
    const { data: eventRows } = await supabase
      .from("subscription_events")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    events = (eventRows ?? []).map((row) =>
      mapEvent(row as Record<string, unknown>),
    );
  } catch {
    events = [];
  }

  return { subscription, plans, invoices, events };
}

function nextInvoiceNumber(businessId: string): string {
  const short = businessId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase();
  return `INV-${short}-${stamp}`;
}

/** Mock provider: updates Postgres only. Swap for StripeBillingProvider later. */
export class MockBillingProvider implements BillingProvider {
  readonly name = "mock" as const;

  async changePlan(input: {
    businessId: string;
    planKey: PlanKey;
    interval: BillingInterval;
  }): Promise<void> {
    const supabase = await createClient();
    const plans = await listBillingPlans();
    const target =
      plans.find((p) => p.planKey === input.planKey) ??
      FALLBACK_PLANS.find((p) => p.planKey === input.planKey);
    if (!target) throw new Error("Unknown plan.");

    const { data: business, error } = await supabase
      .from("businesses")
      .select(
        "id, subscription_plan_key, subscription_status, billing_interval",
      )
      .eq("id", input.businessId)
      .single();
    if (error || !business) {
      throw new Error(error?.message ?? "Business not found.");
    }

    const fromPlan = asPlanKey(business.subscription_plan_key);
    const direction = comparePlans(fromPlan, input.planKey);
    const now = new Date();
    const periodEnd = addBillingPeriod(now, input.interval);
    const amount = planPriceCents(target, input.interval) ?? 0;
    const nextStatus: SubscriptionStatus =
      input.planKey === "starter" ? "active" : "active";

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        subscription_plan_key: input.planKey,
        subscription_status: nextStatus,
        billing_interval: input.interval,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_ends_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", input.businessId);

    if (updateError) throw new Error(updateError.message);

    const eventType =
      direction === "upgrade"
        ? "upgraded"
        : direction === "downgrade"
          ? "downgraded"
          : "interval_changed";

    await supabase.from("subscription_events").insert({
      business_id: input.businessId,
      event_type: eventType,
      from_plan_key: fromPlan,
      to_plan_key: input.planKey,
      from_status: business.subscription_status,
      to_status: nextStatus,
      amount_cents: amount,
      metadata: { provider: "mock", interval: input.interval },
    });

    if (amount > 0) {
      const invoiceNumber = nextInvoiceNumber(input.businessId);
      await supabase.from("billing_invoices").insert({
        business_id: input.businessId,
        invoice_number: invoiceNumber,
        status: "paid",
        plan_key: input.planKey,
        billing_interval: input.interval,
        amount_cents: amount,
        description: `${target.name} · ${input.interval}`,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        paid_at: now.toISOString(),
        pdf_url: null,
      });

      await supabase.from("subscription_events").insert({
        business_id: input.businessId,
        event_type: "invoice_paid",
        to_plan_key: input.planKey,
        amount_cents: amount,
        metadata: { provider: "mock", invoice_number: invoiceNumber },
      });
    }
  }

  async cancelSubscription(input: {
    businessId: string;
    immediately?: boolean;
  }): Promise<void> {
    const supabase = await createClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, subscription_plan_key, subscription_status")
      .eq("id", input.businessId)
      .single();
    if (error || !business) {
      throw new Error(error?.message ?? "Business not found.");
    }

    const now = new Date().toISOString();
    const patch = input.immediately
      ? {
          subscription_status: "canceled" as const,
          cancel_at_period_end: false,
          canceled_at: now,
          updated_at: now,
        }
      : {
          cancel_at_period_end: true,
          updated_at: now,
        };

    const { error: updateError } = await supabase
      .from("businesses")
      .update(patch)
      .eq("id", input.businessId);
    if (updateError) throw new Error(updateError.message);

    await supabase.from("subscription_events").insert({
      business_id: input.businessId,
      event_type: "canceled",
      from_plan_key: asPlanKey(business.subscription_plan_key),
      from_status: business.subscription_status,
      to_status: input.immediately ? "canceled" : business.subscription_status,
      metadata: {
        provider: "mock",
        immediately: Boolean(input.immediately),
      },
    });
  }

  async reactivateSubscription(input: { businessId: string }): Promise<void> {
    const supabase = await createClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, subscription_plan_key, subscription_status")
      .eq("id", input.businessId)
      .single();
    if (error || !business) {
      throw new Error(error?.message ?? "Business not found.");
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        subscription_status: "active",
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: now,
      })
      .eq("id", input.businessId);
    if (updateError) throw new Error(updateError.message);

    await supabase.from("subscription_events").insert({
      business_id: input.businessId,
      event_type: "reactivated",
      to_plan_key: asPlanKey(business.subscription_plan_key),
      from_status: business.subscription_status,
      to_status: "active",
      metadata: { provider: "mock" },
    });
  }
}

let provider: BillingProvider | null = null;

/**
 * Returns the active billing provider.
 * Stripe can replace MockBillingProvider when credentials exist.
 */
export function getBillingProvider(): BillingProvider {
  if (!provider) {
    // Future: if (getStripeSecretKey()) return new StripeBillingProvider();
    provider = new MockBillingProvider();
  }
  return provider;
}

export function resetBillingProvider(): void {
  provider = null;
}

export async function downloadInvoicePayload(invoice: BillingInvoice): Promise<{
  filename: string;
  contentType: string;
  body: string;
}> {
  const lines = [
    "Chasum Invoice",
    `Invoice: ${invoice.invoiceNumber}`,
    `Status: ${invoice.status}`,
    `Amount: ${(invoice.amountCents / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
    `Plan: ${invoice.planKey ?? "n/a"}`,
    `Interval: ${invoice.billingInterval}`,
    `Description: ${invoice.description ?? ""}`,
    `Period: ${invoice.periodStart ?? ""} → ${invoice.periodEnd ?? ""}`,
    `Paid at: ${invoice.paidAt ?? ""}`,
    "",
    "Generated by Chasum Billing Phase 1 (mock provider).",
    "Stripe-hosted invoices will replace this text file when connected.",
  ];

  return {
    filename: `${invoice.invoiceNumber}.txt`,
    contentType: "text/plain;charset=utf-8",
    body: lines.join("\n"),
  };
}
