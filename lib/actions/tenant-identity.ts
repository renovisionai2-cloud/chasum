"use server";

import { requireUser, resolveBusinessForUser } from "@/lib/actions/business";
import { hasOperatorMarker } from "@/lib/access/operator-membership";
import { createServiceClient } from "@/lib/supabase/service";
import {
  newBusinessIdentitySchema,
  type IdentityActionState,
} from "@/lib/tenant-identity/input";
import { redirect } from "next/navigation";

export async function submitBusinessIdentity(
  _previous: IdentityActionState,
  form: FormData,
): Promise<IdentityActionState> {
  const user = await requireUser();
  // Uncached resolution at execution, independent of page/preflight state.
  const existing = await resolveBusinessForUser(user.id);
  if (existing)
    return {
      error: "Your account already has business access. Open your dashboard.",
    };
  if (hasOperatorMarker(user.app_metadata)) redirect("/access-denied");
  if (!user.email_confirmed_at)
    return { error: "Verify your account email before continuing." };
  const intent = form.get("intent");
  if (intent !== "create_new" && intent !== "join_existing")
    return { error: "Choose how to continue." };
  const parsed =
    intent === "create_new"
      ? newBusinessIdentitySchema.safeParse({
          name: form.get("name"),
          legalName: form.get("legalName") ?? "",
          email: form.get("email"),
          phone: form.get("phone"),
          website: form.get("website") ?? "",
          city: form.get("city"),
          region: form.get("region"),
          country: form.get("country"),
          requestedSlug: form.get("requestedSlug") ?? "",
          confirmation: form.get("confirmation"),
        })
      : null;
  if (parsed && !parsed.success)
    return {
      error:
        "Check the business details and confirm this is a genuinely new business.",
    };
  const identity = parsed?.success ? parsed.data : null;
  let outcome: string | undefined;
  try {
    const service = createServiceClient();
    // The RPC performs authoritative preflight, membership recheck, audit and
    // creation in one transaction. No browser preflight token can authorize it.
    const { data, error } = await service.rpc("decide_business_identity", {
      p_actor_user_id: user.id,
      p_intent: intent,
      p_name: identity?.name ?? null,
      p_legal_name: identity?.legalName || null,
      p_email: identity?.email ?? null,
      p_phone: identity?.phone ?? null,
      p_website: identity?.website || null,
      p_city: identity?.city ?? null,
      p_region: identity?.region ?? null,
      p_country: identity?.country ?? null,
      p_requested_slug: identity?.requestedSlug || null,
    });
    if (error)
      return {
        error:
          "Business onboarding is unavailable. Please contact Chasum Support before trying again.",
      };
    outcome = data?.status;
  } catch {
    return {
      error:
        "Business onboarding is unavailable. Please contact Chasum Support.",
    };
  }
  if (outcome === "created") redirect("/dashboard");
  if (outcome === "existing")
    return {
      error: "Your account already has business access. Open your dashboard.",
    };
  if (outcome === "ambiguous") return { review: true };
  if (outcome === "join_existing") return { existing: true };
  return {
    error: "Business access could not be verified. Contact Chasum Support.",
  };
}
