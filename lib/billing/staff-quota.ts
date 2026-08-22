import {
  evaluateStaffQuota,
  evaluateStaffSeatRequest,
  PAID_PLANS_PRIVATE_ALPHA_NOTE,
  type StaffQuotaDecision,
} from "@/lib/billing/plan-entitlements";

type StaffTableClient = {
  // Real Supabase query builders are too deep for a structural type here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

/**
 * Count ACTIVE staff only (`staff.is_active = true`).
 * Inactive/former records stay on file and do not consume a seat.
 */
export async function countBusinessStaff(
  supabase: StaffTableClient,
  businessId: string,
): Promise<number> {
  const counted = await supabase
    .from("staff")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_active", true);
  if (!counted.error && typeof counted.count === "number") {
    return counted.count;
  }
  const fallback = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true);
  return fallback.data?.length ?? 0;
}

export async function staffQuotaForBusiness(
  supabase: StaffTableClient,
  business: { id: string; subscription_plan_key?: string | null },
): Promise<StaffQuotaDecision> {
  const currentCount = await countBusinessStaff(supabase, business.id);
  return evaluateStaffQuota(currentCount, business.subscription_plan_key);
}

export function staffQuotaError(decision: StaffQuotaDecision): string {
  return `${decision.message} ${PAID_PLANS_PRIVATE_ALPHA_NOTE}`;
}

/**
 * Block inactive → active when active capacity is already full.
 * IDs that are already active do not consume an extra seat.
 */
export async function assertCanActivateStaff(
  supabase: StaffTableClient,
  business: { id: string; subscription_plan_key?: string | null },
  staffIds: string[],
): Promise<{ error: string } | null> {
  const ids = [...new Set(staffIds.filter(Boolean))];
  if (ids.length === 0) return null;

  const { data, error } = await supabase
    .from("staff")
    .select("id, is_active")
    .eq("business_id", business.id)
    .in("id", ids);
  if (error) return { error: error.message };

  const additional = (data ?? []).filter(
    (row: { is_active?: boolean | null }) => row.is_active === false,
  ).length;
  if (additional === 0) return null;

  const currentActive = await countBusinessStaff(supabase, business.id);
  const decision = evaluateStaffSeatRequest(
    currentActive,
    additional,
    business.subscription_plan_key,
  );
  if (decision.allowed) return null;
  return { error: staffQuotaError(decision) };
}
