import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { DEFAULT_ONBOARDING_TIMEZONE } from "@/lib/onboarding/business-locale";

function OnboardingTimezoneForm() {
  return (
    <form>
      <input
        name="businessName"
        defaultValue="Northshore Clinic"
        required
        aria-label="Business name"
      />
      <TimezoneSelect
        id="timezone"
        name="timezone"
        label="Timezone"
        defaultValue={DEFAULT_ONBOARDING_TIMEZONE}
        required
      />
      <select name="currency" defaultValue="cad" required aria-label="Currency">
        <option value="cad">CAD — Canadian Dollar</option>
      </select>
      <button type="submit">Create business</button>
    </form>
  );
}

describe("onboarding timezone search vs selected value", () => {
  it("allows submit when timezone is selected and search text is empty", () => {
    render(<OnboardingTimezoneForm />);

    const search = screen.getByRole("searchbox", { name: /search timezones/i });
    expect(search).toHaveValue("");
    expect(search).not.toBeRequired();
    expect(search).not.toHaveAttribute("name");
    expect(search).toHaveAttribute("form", "chasum-timezone-filter");

    const timezone = screen.getByLabelText(/^timezone$/i);
    expect(timezone).toBeRequired();
    expect(timezone).toHaveValue("America/Toronto");

    const form = timezone.closest("form");
    expect(form).toBeTruthy();
    expect(form?.checkValidity()).toBe(true);
  });
});
