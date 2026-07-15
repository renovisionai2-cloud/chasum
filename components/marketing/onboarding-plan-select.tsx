"use client";

import { Label } from "@/components/ui/label";
import {
  MARKETING_PLANS,
  type MarketingPlanId,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

type OnboardingPlanSelectProps = {
  value: MarketingPlanId;
  onChange: (id: MarketingPlanId) => void;
  name?: string;
};

export function OnboardingPlanSelect({
  value,
  onChange,
  name = "plan",
}: OnboardingPlanSelectProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">
        Choose your plan
      </legend>
      <input type="hidden" name={name} value={value} />
      <div className="grid gap-2">
        {MARKETING_PLANS.map((plan) => {
          const selected = value === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onChange(plan.id)}
              className={cn(
                "rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-accent/40"
                  : "border-border bg-card hover:bg-muted/40",
              )}
              aria-pressed={selected}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {plan.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan.price}
                  {plan.priceSuffix ?? ""}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-foreground">
                {plan.tagline}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.description}
              </p>
              {plan.badge ? (
                <p className="mt-1.5 text-[10px] font-medium text-primary">
                  {plan.badge}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
      <Label className="sr-only" htmlFor="plan-field">
        Selected plan
      </Label>
    </fieldset>
  );
}
