import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MARKETING_PLANS,
  type MarketingPlan,
} from "@/lib/marketing/pricing";
import { Check } from "lucide-react";
import Link from "next/link";

function PlanCard({ plan }: { plan: MarketingPlan }) {
  const isExternal = plan.href.startsWith("mailto:");

  return (
    <Card
      className={
        plan.highlighted
          ? "marketing-card-lift relative h-full scale-[1.02] overflow-visible border-primary bg-gradient-to-b from-primary/[0.06] to-card shadow-xl shadow-primary/10"
          : "marketing-card-lift h-full border-border/60"
      }
    >
      {plan.badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground whitespace-nowrap">
          {plan.badge}
        </div>
      ) : null}
      <CardHeader>
        <CardTitle>{plan.title}</CardTitle>
        <p className="text-sm font-medium text-foreground">{plan.tagline}</p>
        <CardDescription>{plan.description}</CardDescription>
        <div className="pt-2">
          <span className="text-4xl font-semibold tracking-tight">
            {plan.price}
          </span>
          {plan.priceSuffix ? (
            <span className="text-muted-foreground">{plan.priceSuffix}</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
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
              className="marketing-cta-button w-full"
            >
              {plan.cta}
            </Button>
          </a>
        ) : (
          <Link href={plan.href} className="mt-8 block">
            <Button
              variant={plan.highlighted ? "primary" : "outline"}
              className="marketing-cta-button w-full"
            >
              {plan.cta}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function PlanCards({
  plans = MARKETING_PLANS,
}: {
  plans?: MarketingPlan[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
