import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BookingPaymentSection,
  defaultBookingPaymentDraft,
  type BookingPaymentDraft,
} from "@/components/booking/booking-payment-section";

function Harness({
  onSubmit = () => undefined,
}: {
  onSubmit?: (formData: FormData) => void;
}) {
  const [catalogPriceCents, setCatalogPriceCents] = useState(10000);
  const [depositCents, setDepositCents] = useState(5000);
  const [value, setValue] = useState<BookingPaymentDraft>({
    ...defaultBookingPaymentDraft(5000),
    mode: "custom",
    amountCents: 5000,
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <BookingPaymentSection
        catalogPriceCents={catalogPriceCents}
        depositCents={depositCents}
        depositRequired
        currency="cad"
        value={value}
        onChange={setValue}
        defaultExpanded
      />
      <button
        type="button"
        onClick={() =>
          setValue((current) => ({ ...current, amountCents: 2500 }))
        }
      >
        External amount
      </button>
      <button
        type="button"
        onClick={() => {
          setCatalogPriceCents(20000);
          setDepositCents(8000);
          setValue({
            ...defaultBookingPaymentDraft(8000),
            mode: "custom",
            amountCents: 8000,
          });
        }}
      >
        External pricing
      </button>
      <button type="submit">Submit booking</button>
      <output data-testid="draft">
        {`${value.mode}:${value.amountCents}:${value.method}:${value.note}:${value.sendReceipt ? "1" : "0"}`}
      </output>
    </form>
  );
}

function amountInput() {
  return screen.getByLabelText("Amount") as HTMLInputElement;
}

function hidden(name: string) {
  const field = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!field) throw new Error(`missing hidden field ${name}`);
  return field;
}

function replaceAmount(value: string) {
  fireEvent.change(amountInput(), { target: { value } });
}

describe("custom payment amount input", () => {
  it("shows the initial draft as two decimals before editing", () => {
    render(<Harness />);
    const input = amountInput();
    expect(input).toHaveValue("50.00");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input.id).toBe("booking_payment_amount");
    expect(hidden("payment_amount_cents")).toHaveValue("5000");
    expect(hidden("payment_mode")).toHaveValue("custom");
  });

  it("keeps a cleared field empty while focused and does not select no-payment", () => {
    render(<Harness />);
    const input = amountInput();
    fireEvent.focus(input);
    replaceAmount("");
    expect(input).toHaveValue("");
    expect(hidden("payment_mode")).toHaveValue("custom");
    expect(hidden("payment_amount_cents")).toHaveValue("0");
    expect(screen.getByTestId("draft")).toHaveTextContent("custom:0:");
  });

  it("accepts continuous typing without reformatting each keystroke", () => {
    render(<Harness />);
    fireEvent.focus(amountInput());
    replaceAmount("7");
    expect(amountInput()).toHaveValue("7");
    expect(hidden("payment_amount_cents")).toHaveValue("700");
    replaceAmount("75");
    expect(amountInput()).toHaveValue("75");
    expect(hidden("payment_amount_cents")).toHaveValue("7500");
    fireEvent.blur(amountInput());
    expect(amountInput()).toHaveValue("75.00");
    expect(hidden("payment_amount_cents")).toHaveValue("7500");
  });

  it("preserves a partial decimal and commits 10.25", () => {
    render(<Harness />);
    fireEvent.focus(amountInput());
    replaceAmount("10.");
    expect(amountInput()).toHaveValue("10.");
    expect(hidden("payment_amount_cents")).toHaveValue("1000");
    replaceAmount("10.2");
    expect(amountInput()).toHaveValue("10.2");
    replaceAmount("10.25");
    expect(amountInput()).toHaveValue("10.25");
    expect(hidden("payment_amount_cents")).toHaveValue("1025");
  });

  it("commits one cent for 0.01 and fifty cents for .5", () => {
    render(<Harness />);
    fireEvent.focus(amountInput());
    replaceAmount("0.01");
    expect(amountInput()).toHaveValue("0.01");
    expect(hidden("payment_amount_cents")).toHaveValue("1");
    replaceAmount(".5");
    expect(amountInput()).toHaveValue(".5");
    expect(hidden("payment_amount_cents")).toHaveValue("50");
    fireEvent.blur(amountInput());
    expect(amountInput()).toHaveValue("0.50");
  });

  it("replaces a selection and edits the middle without forcing two decimals", () => {
    render(<Harness />);
    const input = amountInput();
    fireEvent.focus(input);
    input.setSelectionRange(0, input.value.length);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    replaceAmount("75");
    expect(input).toHaveValue("75");

    replaceAmount("50.00");
    input.setSelectionRange(1, 1);
    fireEvent.keyDown(input, { key: "ArrowRight" });
    replaceAmount("50.0");
    expect(input).toHaveValue("50.0");
    expect(hidden("payment_amount_cents")).toHaveValue("5000");
    replaceAmount("57.00");
    expect(input).toHaveValue("57.00");
    expect(hidden("payment_amount_cents")).toHaveValue("5700");
  });

  it("pastes a valid amount and ignores letters, a sign, and extra precision", () => {
    render(<Harness />);
    fireEvent.focus(amountInput());
    replaceAmount("12.34");
    expect(amountInput()).toHaveValue("12.34");
    expect(hidden("payment_amount_cents")).toHaveValue("1234");

    replaceAmount("abc");
    expect(amountInput()).toHaveValue("12.34");
    expect(hidden("payment_amount_cents")).toHaveValue("1234");

    replaceAmount("-5");
    expect(amountInput()).toHaveValue("12.34");
    expect(hidden("payment_amount_cents")).toHaveValue("1234");

    replaceAmount("12.345");
    expect(amountInput()).toHaveValue("12.34");
    expect(hidden("payment_amount_cents")).toHaveValue("1234");
  });

  it("keeps deposit, full, and custom suggestions and switches edits to custom", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("radio", { name: /record .*deposit/i }));
    expect(hidden("payment_mode")).toHaveValue("deposit");
    expect(amountInput()).toHaveValue("50.00");
    expect(hidden("payment_amount_cents")).toHaveValue("5000");

    fireEvent.change(amountInput(), { target: { value: "12" } });
    expect(hidden("payment_mode")).toHaveValue("custom");
    expect(amountInput()).toHaveValue("12");
    expect(hidden("payment_amount_cents")).toHaveValue("1200");

    fireEvent.click(screen.getByRole("radio", { name: /pay in full/i }));
    expect(hidden("payment_mode")).toHaveValue("full");
    expect(amountInput()).toHaveValue("100.00");
    expect(hidden("payment_amount_cents")).toHaveValue("10000");

    fireEvent.click(screen.getByRole("radio", { name: /record a different amount/i }));
    expect(hidden("payment_mode")).toHaveValue("custom");
    expect(amountInput()).toHaveValue("100.00");
    expect(hidden("payment_amount_cents")).toHaveValue("10000");
  });

  it("preserves cents when the method, note, or receipt preference changes", () => {
    render(<Harness />);
    fireEvent.focus(amountInput());
    replaceAmount("18.50");
    fireEvent.change(screen.getByLabelText("Payment method"), {
      target: { value: "e_transfer" },
    });
    fireEvent.change(screen.getByLabelText("Reference / note"), {
      target: { value: "front desk" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /send payment receipt email/i }));

    expect(hidden("payment_amount_cents")).toHaveValue("1850");
    expect(hidden("payment_method")).toHaveValue("e_transfer");
    expect(hidden("payment_note")).toHaveValue("front desk");
    expect(hidden("payment_send_receipt")).toHaveValue("1");
    expect(screen.getByTestId("draft")).toHaveTextContent("custom:1850:e_transfer:front desk:1");

    replaceAmount("19");
    expect(hidden("payment_send_receipt")).toHaveValue("1");
    expect(hidden("payment_method")).toHaveValue("e_transfer");
    expect(hidden("payment_note")).toHaveValue("front desk");
    expect(hidden("payment_amount_cents")).toHaveValue("1900");
  });

  it("replaces the editing string when the parent changes amount or pricing", () => {
    render(<Harness />);
    fireEvent.focus(amountInput());
    replaceAmount("10.");
    expect(amountInput()).toHaveValue("10.");

    fireEvent.click(screen.getByRole("button", { name: "External amount" }));
    expect(amountInput()).toHaveValue("25.00");
    expect(hidden("payment_amount_cents")).toHaveValue("2500");
    expect(hidden("payment_mode")).toHaveValue("custom");

    fireEvent.focus(amountInput());
    replaceAmount("10.");
    fireEvent.click(screen.getByRole("button", { name: "External pricing" }));
    expect(amountInput()).toHaveValue("80.00");
    expect(hidden("payment_amount_cents")).toHaveValue("8000");
    expect(hidden("price_cents")).toHaveValue("20000");
    expect(screen.getByText("Appointment total").parentElement).toHaveTextContent("$200");
  });

  it("does not change service price or tax and does not submit while editing", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    expect(hidden("price_cents")).toHaveValue("10000");
    expect(hidden("tax_cents")).toHaveValue("");
    expect(hidden("deposit_cents")).toHaveValue("5000");

    const input = amountInput();
    fireEvent.focus(input);
    replaceAmount("150");
    fireEvent.blur(input);
    expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(false);

    expect(hidden("price_cents")).toHaveValue("10000");
    expect(hidden("tax_cents")).toHaveValue("");
    expect(hidden("deposit_cents")).toHaveValue("5000");
    expect(hidden("payment_mode")).toHaveValue("custom");
    expect(hidden("payment_amount_cents")).toHaveValue("15000");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
