export type BillingInterval = "monthly" | "yearly";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

export type PlanKey = "starter" | "professional" | "business" | "enterprise";

export type SubscriptionEventType =
  | "created"
  | "upgraded"
  | "downgraded"
  | "canceled"
  | "reactivated"
  | "trial_started"
  | "trial_ended"
  | "interval_changed"
  | "invoice_paid"
  | "invoice_voided";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible";

export type BillingPlan = {
  planKey: PlanKey;
  name: string;
  description: string | null;
  maxLocations: number | null;
  monthlyPriceCents: number | null;
  yearlyPriceCents: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type BillingSubscription = {
  businessId: string;
  businessName: string;
  planKey: PlanKey;
  planName: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type BillingInvoice = {
  id: string;
  businessId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  planKey: PlanKey | null;
  billingInterval: BillingInterval;
  amountCents: number;
  currency: string;
  description: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  pdfUrl: string | null;
  stripeInvoiceId: string | null;
  stripeHostedInvoiceUrl: string | null;
  createdAt: string;
};

export type SubscriptionEvent = {
  id: string;
  businessId: string;
  eventType: SubscriptionEventType;
  fromPlanKey: PlanKey | null;
  toPlanKey: PlanKey | null;
  fromStatus: string | null;
  toStatus: string | null;
  amountCents: number | null;
  createdAt: string;
};

export type BillingSummary = {
  subscription: BillingSubscription;
  plans: BillingPlan[];
  invoices: BillingInvoice[];
  events: SubscriptionEvent[];
};

/** Future Stripe provider implements this. Mock provider ships in Phase 1. */
export interface BillingProvider {
  readonly name: "mock" | "stripe";
  changePlan(input: {
    businessId: string;
    planKey: PlanKey;
    interval: BillingInterval;
  }): Promise<void>;
  cancelSubscription(input: {
    businessId: string;
    immediately?: boolean;
  }): Promise<void>;
  reactivateSubscription(input: { businessId: string }): Promise<void>;
}
