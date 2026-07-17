import { Button } from "@/components/ui/button";
import {
  MARKETING_PLANS,
  type MarketingPlan,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";

function PlanCard({ plan }: { plan: MarketingPlan }) {
  const isExternal = plan.href.startsWith("mailto:");

  return (
    <article
      className={cn(
        "marketing-card-lift relative flex h-full flex-col rounded-[1.5rem] border p-6 md:p-7",
        plan.highlighted
          ? "z-10 scale-[1.03] border-primary bg-gradient-to-b from-primary/[0.07] to-card shadow-xl shadow-primary/15"
          : "border-border/60 bg-card",
      )}
    >
      {plan.badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
          {plan.badge}
        </div>
      ) : null}

      <div>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {plan.title}
        </h3>
        <p className="mt-1.5 text-sm font-medium text-foreground">
          {plan.tagline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {plan.description}
        </p>
        <div className="mt-6">
          <span className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {plan.price}
          </span>
          {plan.priceSuffix ? (
            <span className="text-muted-foreground">{plan.priceSuffix}</span>
          ) : null}
        </div>
      </div>

      <ul className="mt-8 flex-1 space-y-3.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-sm text-muted-foreground"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      {isExternal ? (
        <a href={plan.href} className="mt-8 block">
          <Button
            variant={plan.highlighted ? "primary" : "outline"}
            className="marketing-cta-button w-full rounded-full"
          >
            {plan.cta}
          </Button>
        </a>
      ) : (
        <Link href={plan.href} className="mt-8 block">
          <Button
            variant={plan.highlighted ? "primary" : "outline"}
            className="marketing-cta-button w-full rounded-full"
          >
            {plan.cta}
          </Button>
        </Link>
      )}
    </article>
  );
}

export function PlanCards({
  plans = MARKETING_PLANS,
}: {
  plans?: MarketingPlan[];
}) {
  return (
    <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
