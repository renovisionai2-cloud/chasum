import { Reveal } from "@/components/landing/reveal";
import { PlanCards } from "@/components/marketing/plan-cards";
import {
  MARKETING_PLANS,
  PRICING_HEADLINE,
  PRICING_SUBHEADING,
} from "@/lib/marketing/pricing";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPARISON_FEATURES = [
  {
    name: "Booking page",
    free: true,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    name: "Core calendar & reception",
    free: true,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    name: "Email reminders",
    free: true,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    name: "AI scheduling assistance",
    free: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    name: "SMS reminders",
    free: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    name: "Automation & waitlist",
    free: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    name: "Locations",
    free: "1",
    professional: "Up to 3",
    business: "Up to 10",
    enterprise: "Unlimited",
  },
  {
    name: "API & webhooks",
    free: false,
    professional: false,
    business: true,
    enterprise: true,
  },
  {
    name: "Custom onboarding / SLA",
    free: false,
    professional: false,
    business: false,
    enterprise: true,
  },
] as const;

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4 w-4 text-primary" aria-label="Included" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 px-6 py-20 md:py-28"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="pricing-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              {PRICING_HEADLINE}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{PRICING_SUBHEADING}</p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mt-14">
            <PlanCards />
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mt-16 overflow-x-auto rounded-[var(--radius-md)] border border-border bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Compare plans</th>
                  {MARKETING_PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className={cn(
                        "px-3 py-3 text-center font-medium",
                        plan.highlighted && "bg-primary/10 text-primary",
                      )}
                    >
                      {plan.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {COMPARISON_FEATURES.map((row) => (
                  <tr key={row.name}>
                    <th className="px-3 py-3 font-medium text-foreground">
                      {row.name}
                    </th>
                    <td className="px-3 py-3 text-center">
                      <Cell value={row.free} />
                    </td>
                    <td className="bg-primary/[0.04] px-3 py-3 text-center">
                      <Cell value={row.professional} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Cell value={row.business} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Cell value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
