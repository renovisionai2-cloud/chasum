import { calculateAlphaSavings, formatCadFromCents } from "@/lib/billing/pricing";
import { getPricingPlan, PRICING_ANNUAL_EXPLANATION } from "@/lib/marketing/pricing";

/** Offer presentation only. Enrollment and billing remain arranged through Chasum. */
export function PricingAlphaOffer() {
  return (
    <>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {PRICING_ANNUAL_EXPLANATION}
      </p>
      <div className="mt-8 grid gap-5 text-left sm:grid-cols-2">
        {(["professional", "business"] as const).map((planId) => {
          const plan = getPricingPlan(planId);
          const savings = calculateAlphaSavings(planId);
          return (
            <article key={planId} className="rounded-[1.5rem] border border-border/70 bg-card p-6 md:p-7">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {plan.name} Alpha
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">Lifetime recurring prices</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                {formatCadFromCents(savings.alphaMonthlyCents)}<span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatCadFromCents(savings.lifetimeSavingPerMonthCents)}/month less than the regular {formatCadFromCents(savings.regularMonthlyCents)}/month.
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                Or {formatCadFromCents(savings.annualTotalCents)}<span className="text-sm font-normal text-muted-foreground">/year</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Paid upfront for 12 months</p>
              <ol className="mt-6 list-decimal space-y-4 pl-5 text-sm text-muted-foreground">
                <li>
                  <span className="block font-semibold text-foreground">Lifetime Alpha pricing</span>
                  Save {formatCadFromCents(savings.lifetimeSavingPerYearCents)}/year at monthly rates.
                </li>
                <li>
                  <span className="block font-semibold text-foreground">Two months free annually</span>
                  Save an additional {formatCadFromCents(savings.additionalAnnualSavingCents)}/year when paid annually.
                </li>
              </ol>
              <p className="mt-6 border-t border-border/60 pt-4 text-sm font-semibold text-foreground">
                {formatCadFromCents(savings.combinedAnnualSavingCents)}/year total savings
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  vs 12 regular monthly payments ({formatCadFromCents(savings.regularYearAtMonthlyCents)})
                </span>
              </p>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Monthly Alpha billing includes the lifetime rate. The two free months apply only when you pay annually.
      </p>
    </>
  );
}
