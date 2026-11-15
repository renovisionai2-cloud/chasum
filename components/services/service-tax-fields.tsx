"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

/** Percent is the operator unit; zero in storage retains the inheritance contract. */
export function ServiceTaxFields({ rateBps = 0 }: { rateBps?: number }) {
  const [mode, setMode] = useState(rateBps > 0 ? "custom" : "inherit");
  const [percent, setPercent] = useState(rateBps > 0 ? String(rateBps / 100) : "");
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor="service-tax-mode">Tax rate</Label>
      <Select id="service-tax-mode" name="tax_mode" value={mode}
        onChange={(event) => setMode(event.target.value)} aria-describedby="service-tax-help">
        <option value="inherit">Inherit business tax rate</option>
        <option value="custom">Custom percentage</option>
      </Select>
      {mode === "custom" && <>
        <Label htmlFor="service-tax-percent">Custom tax rate (%)</Label>
        <Input id="service-tax-percent" name="tax_rate_percent" type="number" inputMode="decimal"
          min={0.01} max={100} step={0.01} required value={percent}
          onChange={(event) => setPercent(event.target.value)} aria-describedby="service-tax-help" />
      </>}
      <p id="service-tax-help" className="text-xs text-muted-foreground">
        {mode === "inherit"
          ? "Uses the business tax settings. A zero service override means inherit."
          : "Enter 13 for 13%, or 0.13 for 0.13%. The business tax-inclusive or tax-exclusive setting still applies."}
      </p>
    </div>
  );
}
