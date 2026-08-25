"use server";

import { assignDesignPartnerPlan } from "@/lib/owner/assign-plan";
import type { ActionState } from "@/lib/types/booking";
import { publicPlanName } from "@/lib/billing/private-alpha-plan";
import { revalidatePath } from "next/cache";

export async function assignDesignPartnerPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await assignDesignPartnerPlan({
    businessId: String(formData.get("business_id") ?? ""),
    planKey: String(formData.get("plan_key") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/owner");
  revalidatePath("/owner/businesses");
  revalidatePath("/owner/subscriptions");
  revalidatePath("/dashboard/settings/billing");

  if (result.unchanged) {
    return {
      success: `Already on ${publicPlanName(result.toPlanKey)}.`,
    };
  }

  return {
    success: `Assigned ${publicPlanName(result.toPlanKey)}. This is a product-plan assignment, not collected payment.`,
  };
}
