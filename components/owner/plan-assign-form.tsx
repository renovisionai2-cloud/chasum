"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { assignDesignPartnerPlanAction } from "@/lib/actions/owner-plan";
import {
  OWNER_ASSIGNABLE_PLAN_KEYS,
  publicPlanName,
} from "@/lib/billing/private-alpha-plan";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction } from "@/hooks/use-form-action";
import { useActionState } from "react";

export function OwnerPlanAssignForm({
  businessId,
  currentPlanKey,
}: {
  businessId: string;
  currentPlanKey: string | null;
}) {
  const [state, action, pending] = useActionState(
    assignDesignPartnerPlanAction,
    {} as ActionState,
  );
  useFormAction(state);

  const current = currentPlanKey ?? "starter";

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="business_id" value={businessId} />
      <Select
        name="plan_key"
        defaultValue={
          current === "professional" ? "professional" : "starter"
        }
        aria-label="Assign product plan"
        className="h-9 min-w-[9.5rem] text-xs"
      >
        {OWNER_ASSIGNABLE_PLAN_KEYS.map((key) => (
          <option key={key} value={key}>
            {publicPlanName(key)}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Assign plan"}
      </Button>
    </form>
  );
}
