"use client";

import { Button } from "@/components/ui/button";
import {
  PRICING_FEATURE_CATALOG,
  PRICING_PLANS,
  getPlanPrice,
  type BillingPeriod,
  type PricingFeatureId,
  type PricingPlanConfig,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import { Check, Minus, Sparkles } from "lucide-react";
import Link from "next/link";

function featureLabel(plan: PricingPlanConfig, id: PricingFeatureId): string {
  const def = PRICING_FEATURE_CATALOG.find((f) => f.id === id);
  const name = def?.name ?? id;
  const value = plan.features[id];
  if (id === "staff_limit" && typeof value === "string") {
    return value === "1" ? "1 Staff Member" : `${value} Staff Members`;
  }
  if (id === "location_limit" && typeof value === "string") {
    return value === "1" ? "1 Location" : `${value} Locations`;
  }
  if (id === "inventory") return `${name} · Available where applicable`;
  if (id === "priority_support" && plan.id === "enterprise") {
    return "SLA & Priority Support";
  }
  return name;
}

function PlanCard({
  plan,
  period,
}: {
  plan: PricingPlanConfig;
  period: BillingPeriod;
}) {
  const pricing = getPlanPrice(plan, period);
  const inherited = plan.inheritedPlan
    ? PRICING_PLANS.find((p) => p.id === plan.inheritedPlan)
    : null;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-[1.5rem] border bg-card p-6 transition-shadow duration-300 md:p-7",
        plan.highlighted
          ? "z-[1] border-primary/70 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] ring-1 ring-primary/20"
          : "border-border/70 hover:border-border hover:shadow-sm",
      )}
    >
      {plan.badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
          {plan.badge}
        </div>
      ) : null}

      <div>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {plan.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {plan.bestFor}
        </p>
        <div className="mt-6">
          <span className="text-4xl font-semibold tracking-tight text-foreground md:text-[2.75rem]">
            {pricing.price}
          </span>
          {pricing.suffix ? (
            <span className="text-muted-foreground">{pricing.suffix}</span>
          ) : null}
          {pricing.note ? (
            <p className="mt-1 text-xs text-muted-foreground">{pricing.note}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex-1 space-y-5">
        {inherited ? (
          <p className="text-sm font-medium text-foreground">
            Includes everything in {inherited.name}
          </p>
        ) : null}

        <ul className="space-y-2.5">
          {plan.cardFeatures.map((id) => {
            const spotlight = plan.spotlightFeatureId === id;
            return (
              <li
                key={id}
                className={cn(
                  "flex items-start gap-2.5 text-sm",
                  spotlight
                    ? "rounded-xl bg-primary/[0.07] px-2.5 py-2 font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {spotlight ? (
                  <Sparkles
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                ) : (
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                )}
                <span>{featureLabel(plan, id)}</span>
              </li>
            );
          })}
        </ul>

        {plan.unavailableFeatures?.length ? (
          <ul className="space-y-2 border-t border-border/60 pt-4">
            {plan.unavailableFeatures.map((id) => (
              <li
                key={id}
                className="flex items-start gap-2.5 text-sm text-muted-foreground/80"
              >
                <Minus
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50"
                  aria-hidden
                />
                <span>
                  <span className="sr-only">Not included: </span>
                  {featureLabel(plan, id)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Link href={plan.ctaHref} className="mt-8 block">
        <Button
          variant={plan.highlighted ? "primary" : "outline"}
          className="marketing-cta-button h-11 w-full rounded-full"
        >
          {plan.ctaLabel}
        </Button>
      </Link>
    </article>
  );
}

export function PricingPlanCards({ period }: { period: BillingPeriod }) {
  return (
    <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {PRICING_PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} period={period} />
      ))}
    </div>
  );
}
