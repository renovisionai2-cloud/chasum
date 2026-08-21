import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingPlanSelect } from "@/components/marketing/onboarding-plan-select";
import { getMarketingPlan } from "@/lib/marketing/pricing";

describe("signup plan descriptions", () => {
  it("does not duplicate the selected plan description", () => {
    const free = getMarketingPlan("free");
    render(<OnboardingPlanSelect value="free" onChange={() => undefined} />);
    const matches = screen.getAllByText(free.description);
    expect(matches).toHaveLength(1);
  });
});
