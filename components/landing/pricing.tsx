import { PlanCards } from "@/components/marketing/plan-cards";
import {
  PRICING_HEADLINE,
  PRICING_SUBHEADING,
} from "@/lib/marketing/pricing";

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {PRICING_HEADLINE}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {PRICING_SUBHEADING}
          </p>
        </div>

        <div className="mt-16">
          <PlanCards />
        </div>
      </div>
    </section>
  );
}
