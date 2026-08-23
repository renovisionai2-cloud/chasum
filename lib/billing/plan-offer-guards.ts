/**
 * Application-level mirrors of Track 2 offer assignment / lifecycle rules.
 * Database triggers remain authoritative. These helpers exist so tests can
 * exercise primary-owner, co-owner, anon, and service_role cases without
 * applying 038 to shared Supabase.
 */

export type JwtRole = "anon" | "authenticated" | "service_role";

export type OfferLifecycleInput = {
  isLocked: boolean;
  isDefaultForNew: boolean;
  isActiveForNewSales: boolean;
};

export function assertOfferLifecycle(input: OfferLifecycleInput): string | null {
  if (input.isDefaultForNew && !input.isLocked) {
    return "draft offers cannot be default for new sales";
  }
  if (input.isDefaultForNew && !input.isActiveForNewSales) {
    return "default offers must also be active for new sales";
  }
  if (input.isActiveForNewSales && !input.isLocked) {
    return "draft offers cannot be active for new sales";
  }
  return null;
}

export const LOCKED_OFFER_IMMUTABLE_FIELDS = [
  "plan_key",
  "version",
  "currency",
  "monthly_cents",
  "annual_cents",
  "max_active_staff",
  "max_locations",
  "sms_included",
  "remove_branding_allowed",
  "api_access_allowed",
  "stripe_price_id_monthly",
  "stripe_price_id_yearly",
  "effective_from",
] as const;

export const LOCKED_OFFER_MUTABLE_FLAGS = [
  "is_default_for_new",
  "is_active_for_new_sales",
] as const;

export function canMutateLockedPayload(): boolean {
  return false;
}

export function canUnlockOffer(): boolean {
  return false;
}

/**
 * auth.role() = 'service_role' is the only trusted assigner.
 * Do NOT treat a null auth.uid() as trusted — anon JWTs also have a null uid.
 * Co-owners are JWT role `authenticated` (same as primary owners).
 */
export function canAssignOfferId(role: JwtRole): boolean {
  return role === "service_role";
}

export function assertOfferAssignment(input: {
  role: JwtRole;
  offerIdChanging: boolean;
  offerId: string | null;
  offerLocked: boolean | null;
  offerPlanKey: string | null;
  businessPlanKey: string;
}): string | null {
  if (input.offerIdChanging && !canAssignOfferId(input.role)) {
    return "offer_id may only be assigned by trusted server role";
  }
  if (input.offerId == null) return null;
  if (!input.offerLocked) {
    return "businesses may only reference locked offers";
  }
  if (input.offerPlanKey !== input.businessPlanKey) {
    return "subscription_plan_key must match plan_offers.plan_key";
  }
  return null;
}
