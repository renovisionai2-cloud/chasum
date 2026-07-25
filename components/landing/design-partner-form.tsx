"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitDesignPartnerApplication,
  type DesignPartnerState,
} from "@/lib/actions/design-partner";
import { PRIVATE_ALPHA_HREF, PRIVACY_HREF } from "@/lib/marketing/alpha";
import { FS_BUSINESS_CATEGORIES } from "@/lib/marketing/flagship-summer";
import Link from "next/link";
import { useActionState, useId } from "react";

const initial: DesignPartnerState = {};

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2";

export function DesignPartnerForm() {
  const [state, action, pending] = useActionState(
    submitDesignPartnerApplication,
    initial,
  );
  const errorSummaryId = useId();

  if (state.ok) {
    return (
      <div
        className="rounded-2xl border border-success/30 bg-success/10 px-6 py-8 text-center"
        role="status"
      >
        <h2 className="text-xl font-semibold text-foreground">
          Application received
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you. We review every Private Alpha application personally and
          will contact you using the details provided. Meanwhile, read{" "}
          <Link
            href={PRIVATE_ALPHA_HREF}
            className="text-primary hover:underline"
          >
            why we run a Private Alpha
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate={false}>
      {state.error ? (
        <div
          id={errorSummaryId}
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
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

      <div>
        <Label htmlFor="industry">Business type</Label>
        <select
          id="industry"
          name="industry"
          required
          className={fieldClass}
          defaultValue=""
        >
          <option value="" disabled>
            Select a business type
          </option>
          {FS_BUSINESS_CATEGORIES.map((category) => (
            <optgroup key={category.id} label={category.label}>
              {category.industries.map((industry) => (
                <option key={industry.id} value={industry.label}>
                  {industry.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="employees">Team size</Label>
          <Input
            id="employees"
            name="employees"
            required
            placeholder="e.g. 1–5, 6–20"
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="locations">Number of locations</Label>
          <Input
            id="locations"
            name="locations"
            required
            placeholder="e.g. 1, 2–5"
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="current_software">
            Current scheduling or business software
          </Label>
          <Input
            id="current_software"
            name="current_software"
            required
            placeholder="Picktime, Fresha, Square…"
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="monthly_appointments">
            Approximate monthly appointments
          </Label>
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
        <Label htmlFor="pain_point">
          What would you most like to improve?
        </Label>
        <Textarea
          id="pain_point"
          name="pain_point"
          required
          rows={3}
          className={fieldClass}
          placeholder="Scheduling, CRM, front desk, payments, reporting…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className={fieldClass}
            autoComplete="email"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Used only to follow up on your application. See our{" "}
            <Link href={PRIVACY_HREF} className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div>
          <Label htmlFor="phone">
            Phone number{" "}
            <span className="font-normal text-muted-foreground">
              · optional
            </span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            className={fieldClass}
            autoComplete="tel"
            placeholder="Any format is fine"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">
          Anything else we should know?{" "}
          <span className="font-normal text-muted-foreground">· optional</span>
        </Label>
        <Textarea id="notes" name="notes" rows={3} className={fieldClass} />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-full"
        disabled={pending}
      >
        {pending ? "Submitting…" : "Submit my application"}
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
