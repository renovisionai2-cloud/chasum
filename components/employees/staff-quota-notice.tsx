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
  if (quota.allowed || !quota.message) return null;

  return (
    <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm">
      <p className="font-medium text-amber-950 dark:text-amber-100">
        {quota.message}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {PAID_PLANS_PRIVATE_ALPHA_NOTE}
      </p>
      <Link href="/apply" className="mt-2 inline-block">
        <Button type="button" size="sm" variant="outline">
          {FREE_PLAN_UPGRADE_CTA}
        </Button>
      </Link>
    </div>
  );
}
