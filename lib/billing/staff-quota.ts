import {
  evaluateStaffQuota,
  type StaffQuotaDecision,
} from "@/lib/billing/plan-entitlements";

type StaffTableClient = {
  // Real Supabase query builders are too deep for a structural type here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

/**
 * Count every staff row for the business (active and inactive).
 * Deactivating a member does not free a seat; deleting does.
 */
export async function countBusinessStaff(
  supabase: StaffTableClient,
  businessId: string,
): Promise<number> {
  const counted = await supabase
    .from("staff")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  if (!counted.error && typeof counted.count === "number") {
    return counted.count;
  }
  const fallback = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId);
  return fallback.data?.length ?? 0;
}

export async function staffQuotaForBusiness(
  supabase: StaffTableClient,
  business: { id: string; subscription_plan_key?: string | null },
): Promise<StaffQuotaDecision> {
  const currentCount = await countBusinessStaff(supabase, business.id);
  return evaluateStaffQuota(currentCount, business.subscription_plan_key);
}
