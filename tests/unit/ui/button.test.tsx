import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button (RTL smoke)", () => {
  it("renders children", () => {
    render(<Button>Save booking</Button>);
    expect(screen.getByRole("button", { name: /save booking/i })).toBeInTheDocument();
  });
});
