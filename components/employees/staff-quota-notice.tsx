import { Button } from "@/components/ui/button";
import {
  PAID_PLANS_PRIVATE_ALPHA_NOTE,
  type StaffQuotaDecision,
} from "@/lib/billing/plan-entitlements";
import { FREE_PLAN_UPGRADE_CTA } from "@/lib/marketing/pricing";
import Link from "next/link";

export function StaffQuotaNotice({
  quota,
}: {
  quota: StaffQuotaDecision;
}) {
  const atCap = !quota.allowed && Boolean(quota.message);
  const finite = quota.max !== null;
  if (!atCap && !finite) return null;

  const remainingNow =
    quota.max === null ? null : Math.max(0, quota.max - quota.currentCount);

  return (
    <div
      className={
        atCap
          ? "rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm"
          : "rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2.5 text-sm"
      }
    >
      {atCap ? (
        <>
          <p className="font-medium text-amber-950 dark:text-amber-100">
            {quota.message}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Active in Chasum: {quota.currentCount} of {quota.max}. Remaining: 0.
            Inactive staff do not consume an active seat. {PAID_PLANS_PRIVATE_ALPHA_NOTE}
          </p>
          <Link href="/apply" className="mt-2 inline-block">
            <Button type="button" size="sm" variant="outline">
              {FREE_PLAN_UPGRADE_CTA}
            </Button>
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Active in Chasum: {quota.currentCount} of {quota.max}. Remaining:{" "}
          {remainingNow}. Inactive staff do not consume an active seat.
        </p>
      )}
    </div>
  );
}
