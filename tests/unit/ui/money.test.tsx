import { render, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Money } from "@/components/ui/money";
afterEach(cleanup);
it.each([0, 1250])("renders EXACT %s cents", cents => { const { container } = render(<Money amount={{ state: "EXACT", cents, currency: "cad" }}/>); expect(container.textContent).toBe(new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", currencyDisplay: "code" }).format(cents / 100)); });
it.each(["HELD", "UNKNOWN"] as const)("renders %s without numeric certainty", state => { const { container } = render(<Money amount={{ state, reason: "TEST" }} cents={0}/>); expect(container.textContent).toMatch(/Held|Unknown/); expect(container.textContent).not.toContain("$0"); });
it.each([undefined, null, NaN])("absence/invalid %# is not zero", cents => { const { container } = render(<Money cents={cents}/>); expect(container.textContent).toContain("Unknown"); });
it("preserves ordinary exact cents and dollars callers", () => { const { rerender, container } = render(<Money cents={0} currency="cad"/>); expect(container.textContent).toContain("$0"); rerender(<Money dollars={12.5} currency="cad"/>); expect(container.textContent).toContain("12.50"); });
