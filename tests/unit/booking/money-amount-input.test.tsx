import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MoneyAmountInput } from "@/components/ui/money-amount-input";
import { useState } from "react";

function Harness({
  initial = 5000,
  selectAllOnFirstFocus = true,
}: {
  initial?: number;
  selectAllOnFirstFocus?: boolean;
}) {
  const [cents, setCents] = useState(initial);
  return (
    <div>
      <MoneyAmountInput
        id="amt"
        amountCents={cents}
        onAmountCentsChange={setCents}
        selectAllOnFirstFocus={selectAllOnFirstFocus}
        aria-label="Amount"
      />
      <output data-testid="cents">{cents}</output>
    </div>
  );
}

describe("MoneyAmountInput interaction", () => {
  it("allows temporary empty without restoring the default amount", () => {
    render(<Harness initial={5000} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    expect(screen.getByTestId("cents").textContent).toBe("0");
    fireEvent.change(input, { target: { value: "75" } });
    expect(input.value).toBe("75");
    expect(screen.getByTestId("cents").textContent).toBe("7500");
  });

  it("replaces a selected amount by typing (select-all / type-to-replace)", () => {
    render(<Harness initial={5000} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "60" } });
    expect(input.value).toBe("60");
    expect(screen.getByTestId("cents").textContent).toBe("6000");
  });

  it("supports natural decimal editing then normalizes on blur", () => {
    render(<Harness initial={5000} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "50.5" } });
    expect(input.value).toBe("50.5");
    fireEvent.blur(input);
    expect(input.value).toBe("50.50");
    expect(screen.getByTestId("cents").textContent).toBe("5050");
  });

  it("does not submit on Enter — blurs instead", () => {
    render(<Harness initial={5000} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    const blur = vi.spyOn(input, "blur");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(blur).toHaveBeenCalled();
  });
});
