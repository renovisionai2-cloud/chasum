export type ServiceCategory = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  billing_interval: "weekly" | "monthly" | "yearly";
  price_cents: number;
  visit_limit: number | null;
  is_unlimited: boolean;
  is_active: boolean;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ServicePackage = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  total_visits: number;
  expires_after_days: number | null;
  transferable: boolean;
  is_active: boolean;
  service_ids: string[];
  created_at: string;
  updated_at: string;
};

export type GiftCard = {
  id: string;
  business_id: string;
  code: string;
  initial_balance_cents: number;
  balance_cents: number;
  is_digital: boolean;
  expires_at: string | null;
  status: "active" | "redeemed" | "expired" | "void";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TaxRate = {
  id: string;
  business_id: string;
  name: string;
  rate_bps: number;
  country: string | null;
  region: string | null;
  inclusive: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscountCode = {
  id: string;
  business_id: string;
  code: string;
  name: string;
  discount_type: "percentage" | "fixed" | "automatic";
  percent_bps: number | null;
  amount_cents: number | null;
  automatic: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomFormTemplate = {
  id: string;
  business_id: string;
  name: string;
  form_type: "consent" | "medical" | "intake" | "waiver" | "questionnaire" | "other";
  description: string | null;
  schema: Record<string, unknown>;
  requires_signature: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessAutomationRule = {
  id: string;
  business_id: string;
  rule_type:
    | "booking"
    | "cancellation"
    | "reminder"
    | "follow_up"
    | "auto_assign"
    | "auto_confirm"
    | "auto_waitlist";
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const BUSINESS_INDUSTRIES = [
  "Medical",
  "Dental",
  "Physiotherapy",
  "Massage",
  "Salon",
  "Spa",
  "Gym",
  "Personal Trainer",
  "Automotive",
  "Home Services",
  "Education",
  "Photography",
  "Pet Services",
  "Professional Services",
  "Government",
  "Enterprise",
  "Other",
] as const;
