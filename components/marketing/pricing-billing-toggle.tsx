"use client";

import { cn } from "@/lib/utils";
import {
  PRICING_ANNUAL_BADGE,
  type BillingPeriod,
} from "@/lib/marketing/pricing";

export function PricingBillingToggle({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div
      className="mx-auto flex flex-wrap items-center justify-center gap-3"
      role="group"
      aria-label="Billing period"
    >
      <button
        type="button"
        aria-pressed={value === "monthly"}
        onClick={() => onChange("monthly")}
        className={cn(
          "marketing-focus-ring rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
          value === "monthly"
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 text-muted-foreground hover:text-foreground",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === "yearly"}
        aria-label="Yearly billing, save 2 months"
        onClick={() => onChange("yearly")}
        className={cn(
          "marketing-focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
          value === "yearly"
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 text-muted-foreground hover:text-foreground",
        )}
      >
        Yearly
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            value === "yearly"
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          {PRICING_ANNUAL_BADGE}
        </span>
      </button>
    </div>
  );
}
