"use client";

import { cn } from "@/lib/utils";
import type { BillingPeriod } from "@/lib/marketing/pricing";

export function PricingBillingToggle({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div
      className="mx-auto inline-flex items-center rounded-full border border-border/70 bg-muted/40 p-1"
      role="group"
      aria-label="Billing period"
    >
      <button
        type="button"
        aria-pressed={value === "monthly"}
        onClick={() => onChange("monthly")}
        className={cn(
          "marketing-focus-ring rounded-full px-5 py-2 text-sm font-semibold transition-[color,background-color,box-shadow] duration-200",
          value === "monthly"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === "yearly"}
        onClick={() => onChange("yearly")}
        className={cn(
          "marketing-focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-[color,background-color,box-shadow] duration-200",
          value === "yearly"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Yearly
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-200",
            value === "yearly"
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          Save 20%
        </span>
      </button>
    </div>
  );
}
