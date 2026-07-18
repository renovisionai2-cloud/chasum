"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitDesignPartnerApplication,
  type DesignPartnerState,
} from "@/lib/actions/design-partner";
import { PRIVATE_ALPHA_HREF } from "@/lib/marketing/alpha";
import Link from "next/link";
import { useActionState } from "react";

const initial: DesignPartnerState = {};

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2";

export function DesignPartnerForm() {
  const [state, action, pending] = useActionState(
    submitDesignPartnerApplication,
    initial,
  );

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 px-6 py-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Application received
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you. We review every application personally and typically reply
          within two business days. Meanwhile, read{" "}
          <Link href={PRIVATE_ALPHA_HREF} className="text-primary hover:underline">
            why we run a Private Alpha
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="business_name">Business name</Label>
        <Input
          id="business_name"
          name="business_name"
          required
          className={fieldClass}
          autoComplete="organization"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            name="industry"
            required
            placeholder="Clinic, salon, spa…"
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="employees">Employees</Label>
          <Input
            id="employees"
            name="employees"
            required
            placeholder="e.g. 1–5, 6–20"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="current_software">Current software</Label>
          <Input
            id="current_software"
            name="current_software"
            required
            placeholder="Picktime, Fresha, Square…"
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="monthly_appointments">Monthly appointments</Label>
          <Input
            id="monthly_appointments"
            name="monthly_appointments"
            required
            placeholder="Approx. volume"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="pain_point">Biggest pain point</Label>
        <Textarea
          id="pain_point"
          name="pain_point"
          required
          rows={3}
          className={fieldClass}
          placeholder="What breaks today in scheduling, CRM, or front desk?"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className={fieldClass}
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            className={fieldClass}
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional notes</Label>
        <Textarea id="notes" name="notes" rows={3} className={fieldClass} />
      </div>

      <Button type="submit" size="lg" className="w-full rounded-full" disabled={pending}>
        {pending ? "Submitting…" : "Submit application"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By applying you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
