import { comparePlans } from "@/lib/billing/catalog";
import {
  isBusinessId,
  isOwnerAssignablePlanKey,
  type OwnerAssignablePlanKey,
} from "@/lib/billing/private-alpha-plan";
import type { PlanKey } from "@/lib/billing/types";
import { requirePlatformOwner } from "@/lib/owner/auth";
import { createServiceClient } from "@/lib/supabase/service";

const PLAN_KEYS: PlanKey[] = [
  "starter",
  "professional",
  "business",
  "enterprise",
];

function asPlanKey(value: unknown): PlanKey {
  if (typeof value === "string" && PLAN_KEYS.includes(value as PlanKey)) {
    return value as PlanKey;
  }
  return "starter";
}

export type AssignDesignPartnerPlanInput = {
  businessId: string;
  planKey: string;
};

export type AssignDesignPartnerPlanResult =
  | {
      ok: true;
      businessId: string;
      fromPlanKey: PlanKey;
      toPlanKey: OwnerAssignablePlanKey;
      unchanged: boolean;
    }
  | { ok: false; error: string };

/**
 * Platform-owner-only product-plan assignment for Private Alpha.
 * Does not collect payment, mint invoices, or write Stripe identifiers.
 */
export async function assignDesignPartnerPlan(
  input: AssignDesignPartnerPlanInput,
): Promise<AssignDesignPartnerPlanResult> {
  const owner = await requirePlatformOwner();

  const businessId = String(input.businessId ?? "").trim();
  const planKeyRaw = String(input.planKey ?? "").trim().toLowerCase();

  if (!isBusinessId(businessId)) {
    return { ok: false, error: "Choose a valid business." };
  }
  if (!isOwnerAssignablePlanKey(planKeyRaw)) {
    return {
      ok: false,
      error:
        "Only Free and Professional can be assigned during Private Alpha.",
    };
  }
  const toPlanKey: OwnerAssignablePlanKey = planKeyRaw;

  const service = createServiceClient();
  const { data: business, error: loadError } = await service
    .from("businesses")
    .select(
      "id, subscription_plan_key, subscription_status, stripe_customer_id, stripe_subscription_id",
    )
    .eq("id", businessId)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: loadError.message };
  }
  if (!business) {
    return { ok: false, error: "Business not found." };
  }

  const fromPlanKey = asPlanKey(business.subscription_plan_key);
  if (fromPlanKey === toPlanKey) {
    return {
      ok: true,
      businessId,
      fromPlanKey,
      toPlanKey,
      unchanged: true,
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await service
    .from("businesses")
    .update({
      subscription_plan_key: toPlanKey,
      updated_at: now,
    })
    .eq("id", businessId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const direction = comparePlans(fromPlanKey, toPlanKey);
  const eventType =
    direction === "upgrade"
      ? "upgraded"
      : direction === "downgrade"
        ? "downgraded"
        : "interval_changed";

  const { error: eventError } = await service.from("subscription_events").insert({
    business_id: businessId,
    event_type: eventType,
    from_plan_key: fromPlanKey,
    to_plan_key: toPlanKey,
    from_status: business.subscription_status ?? "active",
    to_status: business.subscription_status ?? "active",
    amount_cents: 0,
    metadata: {
      source: "owner",
      arrangement: "design_partner_manual",
      actor_email: owner.email,
      actor_user_id: owner.user.id,
    },
  });

  if (eventError) {
    return { ok: false, error: eventError.message };
  }

  return {
    ok: true,
    businessId,
    fromPlanKey,
    toPlanKey,
    unchanged: false,
  };
}
