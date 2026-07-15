import { requirePlatformOwner } from "@/lib/owner/auth";
import {
  formatUsdFromCents,
  planListPriceCents,
} from "@/lib/owner/constants";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getCronSecret,
  getResendApiKey,
  getServiceRoleKey,
  getSupabaseEnv,
  getTwilioConfig,
} from "@/lib/env";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

export type OwnerBusinessRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_plan_key: string | null;
  subscription_status: SubscriptionStatus;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  phone: string | null;
};

export type OwnerAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string | null;
  source: string | null;
  created_at: string;
};

export type OwnerOverviewMetrics = {
  totalBusinesses: number;
  activeBusinesses: number;
  trialBusinesses: number;
  paidBusinesses: number;
  mrrCents: number;
  arrCents: number;
  newSignups7d: number;
  newSignups30d: number;
  mrrLabel: string;
  arrLabel: string;
  systemHealth: {
    ok: boolean;
    checks: {
      supabase: boolean;
      serviceRole: boolean;
      email: boolean;
      cronSecret: boolean;
      sms: boolean;
    };
  };
  recentBusinesses: OwnerBusinessRow[];
  recentAlerts: OwnerAlert[];
  planBreakdown: { planKey: string; count: number; mrrCents: number }[];
};

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

function mapBusiness(row: Record<string, unknown>): OwnerBusinessRow {
  return {
    id: String(row.id),
    name: String(row.name ?? "Untitled"),
    slug: String(row.slug ?? ""),
    owner_id: String(row.owner_id ?? ""),
    subscription_plan_key: (row.subscription_plan_key as string) ?? "starter",
    subscription_status: asStatus(row.subscription_status),
    trial_starts_at: (row.trial_starts_at as string) ?? null,
    trial_ends_at: (row.trial_ends_at as string) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
  };
}

async function loadPlanPrices(): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>();
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("subscription_plans")
      .select("plan_key, monthly_price_cents");
    for (const row of data ?? []) {
      map.set(
        row.plan_key as string,
        (row.monthly_price_cents as number | null) ?? null,
      );
    }
  } catch {
    /* ignore */
  }
  return map;
}

function businessMrrCents(
  business: OwnerBusinessRow,
  prices: Map<string, number | null>,
): number {
  if (
    business.subscription_status === "canceled" ||
    business.subscription_status === "paused"
  ) {
    return 0;
  }
  if (business.subscription_status === "trialing") {
    return 0;
  }
  const key = business.subscription_plan_key ?? "starter";
  const cents = planListPriceCents(key, prices.get(key));
  return cents ?? 0;
}

function isPaid(business: OwnerBusinessRow, prices: Map<string, number | null>) {
  if (business.subscription_status === "trialing") return false;
  if (
    business.subscription_status === "canceled" ||
    business.subscription_status === "paused"
  ) {
    return false;
  }
  const key = business.subscription_plan_key ?? "starter";
  const cents = planListPriceCents(key, prices.get(key));
  return (cents ?? 0) > 0;
}

export async function getOwnerOverviewMetrics(): Promise<OwnerOverviewMetrics> {
  await requirePlatformOwner();
  const service = createServiceClient();
  const prices = await loadPlanPrices();

  const { data: businessRows, error } = await service
    .from("businesses")
    .select(
      "id, name, slug, owner_id, subscription_plan_key, subscription_status, trial_starts_at, trial_ends_at, created_at, updated_at, email, phone",
    )
    .order("created_at", { ascending: false });

  if (error) {
    // Older schemas may lack subscription_status — retry minimal columns.
    const fallback = await service
      .from("businesses")
      .select(
        "id, name, slug, owner_id, subscription_plan_key, created_at, updated_at, email, phone",
      )
      .order("created_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    const businesses = (fallback.data ?? []).map((row) =>
      mapBusiness({ ...row, subscription_status: "active" }),
    );
    return summarize(businesses, prices, []);
  }

  const businesses = (businessRows ?? []).map((row) =>
    mapBusiness(row as Record<string, unknown>),
  );

  let alerts: OwnerAlert[] = [];
  try {
    const { data: alertRows } = await service
      .from("platform_alerts")
      .select("id, severity, title, body, source, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    alerts = (alertRows ?? []).map((a) => ({
      id: a.id as string,
      severity: a.severity as OwnerAlert["severity"],
      title: a.title as string,
      body: (a.body as string) ?? null,
      source: (a.source as string) ?? null,
      created_at: a.created_at as string,
    }));
  } catch {
    alerts = [];
  }

  return summarize(businesses, prices, alerts);
}

function summarize(
  businesses: OwnerBusinessRow[],
  prices: Map<string, number | null>,
  alerts: OwnerAlert[],
): OwnerOverviewMetrics {
  const now = Date.now();
  const day7 = now - 7 * 24 * 60 * 60 * 1000;
  const day30 = now - 30 * 24 * 60 * 60 * 1000;

  const activeBusinesses = businesses.filter(
    (b) =>
      b.subscription_status === "active" ||
      b.subscription_status === "trialing" ||
      b.subscription_status === "past_due",
  ).length;

  const trialBusinesses = businesses.filter((b) => {
    if (b.subscription_status === "trialing") return true;
    if (b.trial_ends_at && new Date(b.trial_ends_at).getTime() > now) return true;
    return false;
  }).length;

  const paidBusinesses = businesses.filter((b) => isPaid(b, prices)).length;

  let mrrCents = 0;
  const planMap = new Map<string, { count: number; mrrCents: number }>();
  for (const b of businesses) {
    const key = b.subscription_plan_key ?? "starter";
    const entry = planMap.get(key) ?? { count: 0, mrrCents: 0 };
    entry.count += 1;
    const mrr = businessMrrCents(b, prices);
    entry.mrrCents += mrr;
    mrrCents += mrr;
    planMap.set(key, entry);
  }

  const supabase = Boolean(getSupabaseEnv());
  const serviceRole = Boolean(getServiceRoleKey());
  const email = Boolean(getResendApiKey());
  const cronSecret = Boolean(getCronSecret());
  const sms = Boolean(getTwilioConfig());

  return {
    totalBusinesses: businesses.length,
    activeBusinesses,
    trialBusinesses,
    paidBusinesses,
    mrrCents,
    arrCents: mrrCents * 12,
    newSignups7d: businesses.filter(
      (b) => new Date(b.created_at).getTime() >= day7,
    ).length,
    newSignups30d: businesses.filter(
      (b) => new Date(b.created_at).getTime() >= day30,
    ).length,
    mrrLabel: formatUsdFromCents(mrrCents),
    arrLabel: formatUsdFromCents(mrrCents * 12),
    systemHealth: {
      ok: supabase && serviceRole && email && cronSecret,
      checks: {
        supabase,
        serviceRole,
        email,
        cronSecret,
        sms,
      },
    },
    recentBusinesses: businesses.slice(0, 8),
    recentAlerts: alerts,
    planBreakdown: [...planMap.entries()].map(([planKey, v]) => ({
      planKey,
      count: v.count,
      mrrCents: v.mrrCents,
    })),
  };
}

export async function listOwnerBusinesses(): Promise<OwnerBusinessRow[]> {
  await requirePlatformOwner();
  const service = createServiceClient();
  const { data, error } = await service
    .from("businesses")
    .select(
      "id, name, slug, owner_id, subscription_plan_key, subscription_status, trial_starts_at, trial_ends_at, created_at, updated_at, email, phone",
    )
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await service
      .from("businesses")
      .select(
        "id, name, slug, owner_id, subscription_plan_key, created_at, updated_at, email, phone",
      )
      .order("created_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []).map((row) =>
      mapBusiness({ ...row, subscription_status: "active" }),
    );
  }

  return (data ?? []).map((row) => mapBusiness(row as Record<string, unknown>));
}

export async function listOwnerTrials(): Promise<OwnerBusinessRow[]> {
  const all = await listOwnerBusinesses();
  const now = Date.now();
  return all.filter((b) => {
    if (b.subscription_status === "trialing") return true;
    if (b.trial_ends_at && new Date(b.trial_ends_at).getTime() > now) return true;
    return false;
  });
}

export async function getOwnerSecuritySnapshot() {
  await requirePlatformOwner();
  const emails = (
    await import("@/lib/env")
  ).getPlatformOwnerEmails();

  let dbAdmins: { email: string; role: string; created_at: string }[] = [];
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("platform_admins")
      .select("email, role, created_at")
      .order("created_at", { ascending: false });
    dbAdmins = (data ?? []).map((row) => ({
      email: row.email as string,
      role: row.role as string,
      created_at: row.created_at as string,
    }));
  } catch {
    dbAdmins = [];
  }

  return {
    envOwnerCount: emails.length,
    dbAdmins,
    rlsNote:
      "Customer data remains owner-scoped via RLS. Owner Platform reads use the service role only after platform-owner authorization.",
  };
}
